import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

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

    const userId = (session.user as { id?: string }).id;
    const { id } = await params;

    await connectDB();
    const order = await Order.findById(id).lean();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Security: buyers can only view their own orders
    if (order.buyerId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
