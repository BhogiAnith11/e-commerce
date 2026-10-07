import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function POST(
  req,
  { params }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'You must be signed in to submit a review' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || '').trim();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const userId = session.user.id || new mongoose.Types.ObjectId().toString();
    const userName = session.user.name || session.user.email?.split('@')[0] || 'Verified Buyer';

    if (!product.reviews) {
      product.reviews = [];
    }

    const existingIndex = product.reviews.findIndex(
      (r) => String(r.userId) === String(userId)
    );

    if (existingIndex > -1) {
      product.reviews[existingIndex].rating = rating;
      product.reviews[existingIndex].comment = comment;
      product.reviews[existingIndex].createdAt = new Date();
    } else {
      product.reviews.push({
        userId: mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : new mongoose.Types.ObjectId(),
        userName,
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    const allRatings = product.reviews.map((r) => r.rating);
    const avgRating = Number(
      (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)
    );

    product.rating = avgRating;
    product.numReviews = product.reviews.length;
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully!',
      rating: product.rating,
      numReviews: product.numReviews,
      reviews: product.reviews,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req,
  { params }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(id).select('rating numReviews reviews title').lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      rating: product.rating || 0,
      numReviews: product.numReviews || 0,
      reviews: product.reviews || [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
