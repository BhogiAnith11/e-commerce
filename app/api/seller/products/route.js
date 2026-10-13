import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';
import { uploadToS3 } from '@/lib/s3';
import { indexProduct } from '@/lib/algolia';
import { v4 as uuidv4 } from 'uuid';

async function resolveSellerId(session){
  await connectDB();
  if (session?.user) {
    const userObj = session.user;
    if (userObj.id && mongoose.Types.ObjectId.isValid(userObj.id)) {
      return new mongoose.Types.ObjectId(userObj.id);
    }
    if (userObj.email) {
      const user = await User.findOne({ email: userObj.email.toLowerCase() });
      if (user) return user._id;
    }
  }
  return null;
}

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = await resolveSellerId(session);
    if (!sellerId) {
      return NextResponse.json({
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { published: 0, draft: 0, delisted: 0, total: 0 },
      });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    const filter = { sellerId };
    if (statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Summary counts for dashboard stats cards strictly for this seller
    const [publishedCount, draftCount, delistedCount] = await Promise.all([
      Product.countDocuments({ sellerId, status: 'published' }),
      Product.countDocuments({ sellerId, status: 'draft' }),
      Product.countDocuments({ sellerId, status: 'delisted' }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        published: publishedCount,
        draft: draftCount,
        delisted: delistedCount,
        total: publishedCount + draftCount + delistedCount,
      },
    });
  } catch (error) {
    console.error('GET /api/seller/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in as a seller.' }, { status: 401 });
    }

    const sellerId = await resolveSellerId(session);
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      price,
      stock,
      imageUrl,
      imageBase64,
      tags,
      status = 'published',
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'Valid product price is required' }, { status: 400 });
    }
    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Product image is required' }, { status: 400 });
    }

    let finalImageUrl = imageUrl;
    const mediaId = uuidv4();

    if (imageBase64 && !imageUrl) {
      try {
        const buffer = Buffer.from(imageBase64, 'base64');
        const key = `media/${sellerId.toString()}/${mediaId}.jpg`;
        finalImageUrl = await uploadToS3(key, buffer, 'image/jpeg');
      } catch (s3Err) {
        console.warn('S3 upload fallback to base64 data URL:', s3Err);
        finalImageUrl = `data:image/jpeg;base64,${imageBase64}`;
      }
    }

    await connectDB();

    const product = await Product.create({
      sellerId,
      title: title.trim(),
      description: description?.trim() || `${title.trim()} - High quality product listed on ShopEZ.`,
      category: category?.trim() || 'General',
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      price: Number(price),
      stock: Number(stock) >= 0 ? Number(stock) : 10,
      imageUrl: finalImageUrl,
      status: status === 'draft' ? 'draft' : 'published',
      mediaId,
    });

    // Algolia indexing
    try {
      await indexProduct({
        objectID: product._id.toString(),
        title: product.title,
        description: product.description,
        category: product.category,
        tags: product.tags,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        sellerId: product.sellerId.toString(),
        status: product.status,
      });
    } catch (algoliaErr) {
      console.warn('Algolia indexing error (non-fatal):', algoliaErr);
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/seller/products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

