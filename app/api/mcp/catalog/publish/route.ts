import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { indexProduct } from '@/lib/algolia';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();

    const {
      draft_id,
      seller_confirmed,
      final_price,
      title,
      description,
      category,
      tags,
      image_url,
      media_id,
      seller_id,
      stock = 1,
    } = body;

    const resolvedSellerId = seller_id || (session?.user as { id?: string })?.id || '000000000000000000000001';

    // Hard gate: seller must explicitly confirm (BRD BR-04)
    if (seller_confirmed !== true) {
      return NextResponse.json(
        { error: 'publish_listing requires seller_confirmed=true' },
        { status: 400 }
      );
    }

    if (!draft_id || !final_price || !title || !image_url) {
      return NextResponse.json(
        { error: 'draft_id, final_price, title, and image_url are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.create({
      sellerId: mongoose.Types.ObjectId.isValid(resolvedSellerId)
        ? new mongoose.Types.ObjectId(resolvedSellerId)
        : new mongoose.Types.ObjectId('000000000000000000000001'),
      title,
      description,
      category,
      tags: tags || [],
      price: final_price,
      stock,
      imageUrl: image_url,
      status: 'published',
      mediaId: media_id,
      draftId: draft_id,
    });

    // Index in Algolia
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
    } catch (algoliaError) {
      console.error('Algolia indexing failed (non-fatal):', algoliaError);
    }

    return NextResponse.json({
      product_id: product._id.toString(),
      status: 'published',
    });
  } catch (error) {
    console.error('publish_listing error:', error);
    return NextResponse.json({ error: 'Failed to publish listing' }, { status: 500 });
  }
}
