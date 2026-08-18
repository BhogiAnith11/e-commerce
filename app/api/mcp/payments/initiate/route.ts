import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import { createPaymentIntent } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id?: string }).id!;

    const { order_id, buyer_confirmed, payment_method = 'card' } = await req.json();

    // Hard gate: buyer must explicitly confirm
    if (buyer_confirmed !== true) {
      return NextResponse.json(
        { error: 'initiate_payment requires buyer_confirmed=true' },
        { status: 400 }
      );
    }

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(order_id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.buyerId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'created') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await createPaymentIntent(order.totalAmount, 'inr', {
      order_id: order_id,
      buyer_id: userId,
    });

    // Update order with payment intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    order.status = 'paid'; // In production, update via Stripe webhook
    await order.save();

    // Clear cart after successful order
    await Cart.findOneAndDelete({ buyerId: userId });

    return NextResponse.json({
      payment_status: paymentIntent.status,
      transaction_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      order_id,
    });
  } catch (error) {
    console.error('initiate_payment error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
