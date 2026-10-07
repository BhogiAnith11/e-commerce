import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { indexProduct, deleteProductIndex } from '@/lib/algolia';

/**
 * GET /api/seller/products/[id]
 * Single product for seller (all statuses).
 *
 * PATCH /api/seller/products/[id]
 * Full manual edit form endpoint — same backend AI agent's update_listing tool.
 *
 * DELETE /api/seller/products/[id]
 * Delist a product.
 */
export async function GET(
  _req,
  { params }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const userId = session.user.id;
    if (product.sellerId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PATCH(
  req,
  { params }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const userId = session.user.id;

    // Whitelist allowed editable fields (same update_listing tool)
    const allowedFields = ['title', 'description', 'category', 'tags', 'price', 'stock', 'status'];
    const updates = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    // Validate status transitions
    if (updates.status && !['published', 'delisted'].includes(updates.status)) {
      return NextResponse.json({ error: 'Invalid status. Use "published" or "delisted".' }, { status: 400 });
    }

    if (updates.price !== undefined && (typeof updates.price !== 'number' || (updates.price) < 0)) {
      return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
    }

    if (updates.stock !== undefined && (typeof updates.stock !== 'number' || (updates.stock) < 0)) {
      return NextResponse.json({ error: 'stock must be a non-negative number' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.sellerId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    Object.assign(product, updates);
    await product.save();

    // Re-index or remove from Algolia depending on status
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
      } catch (e) { console.error('Algolia re-index failed:', e); }
    } else if (product.status === 'delisted') {
      try { await deleteProductIndex(id); } catch (e) { console.error('Algolia delete failed:', e); }
    }

    return NextResponse.json({ message: 'Product updated', product });
  } catch (error) {
    console.error('PATCH /api/seller/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req,
  { params }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.sellerId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    product.status = 'delisted';
    await product.save();

    try { await deleteProductIndex(id); } catch (e) { console.error('Algolia delist failed:', e); }

    return NextResponse.json({ message: 'Product delisted', product_id: id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delist product' }, { status: 500 });
  }
}
