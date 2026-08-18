import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { indexProduct } from '@/lib/algolia';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_id, updates } = await req.json();

    if (!product_id || !updates) {
      return NextResponse.json({ error: 'product_id and updates are required' }, { status: 400 });
    }

    // Whitelist of updatable fields
    const allowedFields = ['title', 'description', 'category', 'tags', 'price', 'stock'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }

    await connectDB();
    const product = await Product.findByIdAndUpdate(
      product_id,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Re-index in Algolia
    if (product.status === 'published') {
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
      } catch (e) {
        console.error('Algolia re-index failed:', e);
      }
    }

    return NextResponse.json({ product_id, status: 'updated', product });
  } catch (error) {
    console.error('update_listing error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
