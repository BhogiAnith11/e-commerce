import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-07-29.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe
 * Receives Stripe events to update order status.
 * Handles:
 *   - payment_intent.succeeded  → mark order as 'paid', clear cart
 *   - payment_intent.payment_failed → keep order as 'created'
 */
export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;
        const buyerId = paymentIntent.metadata?.buyer_id;

        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            status: 'paid',
            stripePaymentIntentId: paymentIntent.id,
          });

          // Clear buyer cart upon payment success
          if (buyerId) {
            await Cart.findOneAndDelete({ buyerId });
          }

          console.log(`Order ${orderId} marked via Stripe webhook`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          // Revert order to 'created' so buyer can retry
          await Order.findByIdAndUpdate(orderId, { status: 'created' });
          console.log(`Order ${orderId} payment failed — reverted to created`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;
        if (orderId) {
          await Order.findByIdAndUpdate(orderId, { status: 'cancelled' });
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
