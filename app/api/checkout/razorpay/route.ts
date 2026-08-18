import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create order with Razorpay in paise
    const rzpOrder = await createRazorpayOrder(order.totalAmount, order_id);

    return NextResponse.json({
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      customer_name: order.shippingAddress?.name || 'Customer',
      customer_phone: order.shippingAddress?.phone || '9999999999',
    });
  } catch (error: any) {
    console.error('POST /api/checkout/razorpay error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initialize Razorpay payment' }, { status: 500 });
  }
}
