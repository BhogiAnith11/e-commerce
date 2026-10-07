import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import User from '@/models/User';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/resend';

export async function POST(req) {
  try {
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      buyer_confirmed = true,
      payment_method_label = 'Razorpay (UPI / Card / NetBanking)',
    } = await req.json();

    if (!order_id || !razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing required Razorpay payment fields' }, { status: 400 });
    }

    // Hard Gate Confirmation Check (BR-08)
    if (buyer_confirmed !== true) {
      return NextResponse.json({ error: 'Explicit buyer confirmation required.' }, { status: 400 });
    }

    // Signature verification
    if (razorpay_signature) {
      const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Razorpay signature. Payment verification failed.' }, { status: 400 });
      }
    }

    await connectDB();
    const order = await Order.findById(order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Estimated delivery date 3 days out
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    order.stripePaymentIntentId = razorpay_payment_id;
    order.paymentMethod = payment_method_label;
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

    // Send confirmation email via Resend
    const buyer = await User.findById(order.buyerId);
    const buyerEmail = buyer?.email || 'customer@shopez.com';
    const buyerName = order.shippingAddress?.name || buyer?.name || 'Customer';
    sendOrderConfirmationEmail(buyerEmail, buyerName, order).catch((e) =>
      console.warn('Resend Razorpay confirmation email warning:', e)
    );

    return NextResponse.json({
      success: true,
      order_id,
      payment_id: razorpay_payment_id,
      status: 'paid',
    });
  } catch (error) {
    console.error('POST /api/checkout/razorpay/verify error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
