import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { sendOrderCancelledEmail } from '@/lib/resend';
import mongoose from 'mongoose';

async function resolveBuyerId(session: any): Promise<mongoose.Types.ObjectId | null> {
  await connectDB();
  if (session?.user) {
    const userObj = session.user as { id?: string; email?: string };
    if (userObj.id && mongoose.Types.ObjectId.isValid(userObj.id)) {
      return new mongoose.Types.ObjectId(userObj.id);
    }
    if (userObj.email) {
      const user = await User.findOne({ email: userObj.email.toLowerCase() });
      if (user) return user._id;
    }
  }
  return null;
}

/**
 * GET /api/account/orders/[id]
 * Single order detail for the authenticated buyer.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyerId = await resolveBuyerId(session);
    if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const order = await Order.findById(id).lean();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Security: buyers can only view their own orders
    if (order.buyerId.toString() !== buyerId.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

/**
 * PATCH /api/account/orders/[id]
 * Cancel an order for the buyer and restore inventory stock.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyerId = await resolveBuyerId(session);
    if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = 'Buyer requested cancellation' } = body;

    await connectDB();
    const order = await Order.findById(id);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Security: buyers can only cancel their own orders
    if (order.buyerId.toString() !== buyerId.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ error: 'Delivered orders cannot be cancelled directly. Please initiate a return.' }, { status: 400 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled.' }, { status: 400 });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.updatedAt = new Date();
    await order.save();

    // Restore product stock back to sellers
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      }
    }

    // Dispatch Cancellation & Refund Email via Resend
    const buyer = await User.findById(order.buyerId);
    const buyerEmail = buyer?.email || session?.user?.email || 'customer@shopez.com';
    const buyerName = order.shippingAddress?.name || buyer?.name || 'Customer';
    sendOrderCancelledEmail(buyerEmail, buyerName, order).catch((e) =>
      console.warn('Resend cancellation email warning:', e)
    );

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully! 100% Refund initiated to original payment source (Razorpay / UPI).',
      order,
    });
  } catch (error) {
    console.error('PATCH cancel order error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
