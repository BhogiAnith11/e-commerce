import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Order from '@/models/Order';
import User from '@/models/User';
import mongoose from 'mongoose';

const SHIPPING_FEE = 49;

async function resolveBuyerId(session, req){
  await connectDB();

  if (session?.user?.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
    return new mongoose.Types.ObjectId(session.user.id);
  }

  if (session?.user?.email) {
    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (user) return user._id;
  }

  let guestUser = await User.findOne({ email: 'guest@shopez.com' });
  if (!guestUser) {
    guestUser = await User.create({
      name: 'Guest Shopper',
      email: 'guest@shopez.com',
      role: 'buyer',
      passwordHash: 'guest_no_login_needed',
    });
  }
  return guestUser._id;
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(req);

    const { shipping_address } = await req.json();

    if (!shipping_address || !shipping_address.name || !shipping_address.line1) {
      return NextResponse.json({ error: 'Please enter your full name and delivery address' }, { status: 400 });
    }

    await connectDB();
    const cart = await Cart.findOne({ buyerId });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Please add products to cart first.' }, { status: 400 });
    }

    const subtotal = cart.items.reduce((s, item) => s + item.price * item.qty, 0);
    const totalAmount = subtotal + SHIPPING_FEE;

    const order = await Order.create({
      buyerId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        imageUrl: item.imageUrl,
        price: item.price,
        qty: item.qty,
      })),
      totalAmount,
      shippingAddress: shipping_address,
      status: 'created',
    });

    return NextResponse.json({
      order_id: order._id.toString(),
      total_amount: totalAmount,
      subtotal,
      shipping_fee: SHIPPING_FEE,
    });
  } catch (error) {
    console.error('POST /api/checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
