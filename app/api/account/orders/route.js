import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ orders: [], message: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    let buyerId = null;
    const userObj = session.user;
    if (userObj.id && mongoose.Types.ObjectId.isValid(userObj.id)) {
      buyerId = new mongoose.Types.ObjectId(userObj.id);
    } else if (userObj.email) {
      const user = await User.findOne({ email: userObj.email.toLowerCase() });
      if (user) buyerId = user._id;
    }

    if (!buyerId) {
      return NextResponse.json({ orders: [] });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status');

    const filter = { buyerId };
    if (status && ['created', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/account/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
