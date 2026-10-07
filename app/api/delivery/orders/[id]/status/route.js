import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status, courierName, trackingNumber, deliveryNotes } = body;

    const allowedStatuses = ['created', 'paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    await connectDB();
    const updateData = {};
    if (status) updateData.status = status;
    if (courierName) updateData.courierName = courierName;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (deliveryNotes) updateData.deliveryNotes = deliveryNotes;

    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${updatedOrder.status.toUpperCase()}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}
