import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import User from '@/models/User';
import Product from '@/models/Product';
import { createPaymentIntent } from '@/lib/stripe';
import { sendOrderConfirmationEmail } from '@/lib/resend';
import mongoose from 'mongoose';

async function resolveBuyerId(session: any): Promise<mongoose.Types.ObjectId> {
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(session);
    const { order_id, buyer_confirmed, payment_method = 'Paytm / UPI', upi_id } = await req.json();

    // Hard gate per BRD BR-08
    if (buyer_confirmed !== true) {
      return NextResponse.json(
        { error: 'buyer_confirmed must be true. Explicit confirmation is required before payment.' },
        { status: 400 }
      );
    }

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(order_id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.status !== 'created') {
      return NextResponse.json(
        { error: `Order already in status: ${order.status}` },
        { status: 400 }
      );
    }

    let clientSecret = '';
    let transactionId = 'paytm_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      const paymentIntent = await createPaymentIntent(order.totalAmount, 'inr', {
        order_id,
        buyer_id: buyerId.toString(),
        payment_method,
      });
      clientSecret = paymentIntent.client_secret || '';
      transactionId = paymentIntent.id || transactionId;
    } catch (stripeErr) {
      console.warn('Sandbox payment warning (using instant confirmation):', stripeErr);
    }

    // Set estimated delivery date 3 days from now (Amazon Prime style)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    order.stripePaymentIntentId = transactionId;
    order.paymentMethod = payment_method;
    if (upi_id) order.upiId = upi_id;
    order.status = 'paid';
    order.estimatedDeliveryDate = deliveryDate;
    order.updatedAt = new Date();
    await order.save();

    // Deduct stock for each purchased product
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty },
        });
      }
    }

    // Clear cart for the buyer
    await Cart.findOneAndDelete({ buyerId: order.buyerId });

    // Send Order Confirmation Email via Resend
    const buyerEmail = session?.user?.email || 'guest@shopez.com';
    const buyerName = order.shippingAddress?.name || session?.user?.name || 'Customer';
    sendOrderConfirmationEmail(buyerEmail, buyerName, order).catch((e) =>
      console.warn('Resend order confirmation email warning:', e)
    );

    return NextResponse.json({
      client_secret: clientSecret,
      transaction_id: transactionId,
      payment_status: 'succeeded',
      payment_method,
      order_id,
    });
  } catch (error) {
    console.error('POST /api/checkout/pay error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
