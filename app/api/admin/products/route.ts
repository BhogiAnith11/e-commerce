import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { indexProduct, deleteProductIndex } from '@/lib/algolia';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = searchParams.get('query');

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET /api/admin/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin products' }, { status: 500 });
  }
}
