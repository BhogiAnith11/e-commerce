import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(req) {
  try {
    await connectDB();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('buyerId', 'name email')
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Fetch delivery orders error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch delivery orders' }, { status: 500 });
  }
}
