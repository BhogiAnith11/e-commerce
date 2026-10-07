import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';

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
