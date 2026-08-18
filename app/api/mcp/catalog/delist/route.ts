import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { deleteProductIndex } from '@/lib/algolia';

export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json();
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findByIdAndUpdate(
      product_id,
      { status: 'delisted', updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Remove from Algolia search
    try {
      await deleteProductIndex(product_id);
    } catch (e) {
      console.warn('Algolia delete failed (non-fatal):', e);
    }

    return NextResponse.json({ product_id, status: 'delisted' });
  } catch (error) {
    console.error('delist_product error:', error);
    return NextResponse.json({ error: 'Failed to delist product' }, { status: 500 });
  }
}
