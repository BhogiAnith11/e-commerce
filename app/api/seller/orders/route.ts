import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';

async function resolveSellerId(session: any): Promise<mongoose.Types.ObjectId | null> {
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

// GET /api/seller/orders — Orders placed by buyers strictly for THIS seller's products (including cancellations)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = await resolveSellerId(session);
    if (!sellerId) {
      return NextResponse.json({
        orders: [],
        metrics: { totalRevenue: 0, totalUnitsSold: 0, totalOrdersCount: 0, cancelledCount: 0 },
      });
    }

    await connectDB();

    // Fetch this seller's products strictly
    const sellerProducts = await Product.find({ sellerId }).select('_id').lean();
    if (sellerProducts.length === 0) {
      return NextResponse.json({
        orders: [],
        metrics: { totalRevenue: 0, totalUnitsSold: 0, totalOrdersCount: 0, cancelledCount: 0 },
      });
    }

    const sellerProductIds = new Set(sellerProducts.map((p) => p._id.toString()));

    // Fetch all confirmed, paid, shipped, delivered, AND cancelled orders
    const allOrders = await Order.find({
      status: { $in: ['paid', 'shipped', 'delivered', 'cancelled'] },
    })
      .sort({ createdAt: -1 })
      .lean();

    let totalRevenue = 0;
    let totalUnitsSold = 0;
    let cancelledCount = 0;
    const sellerOrders: any[] = [];

    for (const order of allOrders) {
      const matchingItems = (order.items || []).filter((item: any) =>
        item.productId && sellerProductIds.has(item.productId.toString())
      );

      if (matchingItems.length > 0) {
        const orderSellerTotal = matchingItems.reduce(
          (sum: number, it: any) => sum + (it.price || 0) * (it.qty || 1),
          0
        );
        const orderSellerQty = matchingItems.reduce(
          (sum: number, it: any) => sum + (it.qty || 1),
          0
        );

        if (order.status === 'cancelled') {
          cancelledCount++;
        } else {
          totalRevenue += orderSellerTotal;
          totalUnitsSold += orderSellerQty;
        }

        sellerOrders.push({
          _id: order._id.toString(),
          buyerName: order.shippingAddress?.name || 'Customer',
          buyerPhone: order.shippingAddress?.phone || 'N/A',
          city: order.shippingAddress?.city || 'Bengaluru',
          state: order.shippingAddress?.state || 'Karnataka',
          postalCode: order.shippingAddress?.postalCode || '560038',
          items: matchingItems,
          totalPaid: orderSellerTotal,
          paymentMethod: order.paymentMethod || 'Razorpay / UPI',
          status: order.status,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          createdAt: order.createdAt,
        });
      }
    }

    return NextResponse.json({
      orders: sellerOrders,
      metrics: {
        totalRevenue,
        totalUnitsSold,
        totalOrdersCount: sellerOrders.length,
        cancelledCount,
      },
    });
  } catch (error) {
    console.error('GET /api/seller/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch seller orders' }, { status: 500 });
  }
}

// PATCH /api/seller/orders — Update dispatch status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, status } = await req.json();
    if (!order_id || !status) {
      return NextResponse.json({ error: 'order_id and status are required' }, { status: 400 });
    }

    if (!['paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    await connectDB();
    const updated = await Order.findByIdAndUpdate(
      order_id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('PATCH /api/seller/orders error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
