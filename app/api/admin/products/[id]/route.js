import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { indexProduct, deleteProductIndex } from '@/lib/algolia';

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await connectDB();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (body.status) product.status = body.status;
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.stock !== undefined) product.stock = Number(body.stock);
    if (body.title) product.title = body.title;
    if (body.category) product.category = body.category;

    product.updatedAt = new Date();
    await product.save();

    // Sync search index
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
        console.warn('Algolia indexing warning:', e);
      }
    } else {
      try {
        await deleteProductIndex(product._id.toString());
      } catch (e) {
        console.warn('Algolia delete warning:', e);
      }
    }

    return NextResponse.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('PATCH /api/admin/products/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req,
  { params }
) {
  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findByIdAndDelete(id);

    try {
      await deleteProductIndex(id);
    } catch (e) {
      console.warn('Algolia delete warning:', e);
    }

    return NextResponse.json({ message: 'Product deleted successfully', id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
