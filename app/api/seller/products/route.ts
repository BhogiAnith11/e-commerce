import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * GET /api/seller/products
 * Returns ALL of the authenticated seller's products (draft + published + delisted).
 * Query params:
 *   - status: filter by status (draft | published | delisted | all)
 *   - page, limit: pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    await connectDB();

    const filter: Record<string, unknown> = { sellerId: userId };
    if (statusFilter !== 'all') {
      if (!['draft', 'published', 'delisted'].includes(statusFilter)) {
        return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
      }
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

    // Summary counts for dashboard stats cards
    const [publishedCount, draftCount, delistedCount] = await Promise.all([
      Product.countDocuments({ sellerId: userId, status: 'published' }),
      Product.countDocuments({ sellerId: userId, status: 'draft' }),
      Product.countDocuments({ sellerId: userId, status: 'delisted' }),
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
