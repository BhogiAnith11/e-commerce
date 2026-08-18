import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import AgentActionLog from '@/models/AgentActionLog';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    // Optional check: if session exists, verify admin or allow portal view
    await connectDB();

    const [
      totalProducts,
      publishedProducts,
      draftProducts,
      delistedProducts,
      totalOrders,
      paidOrders,
      totalUsers,
      sellersCount,
      buyersCount,
      agentLogsCount,
      confirmedAgentActions,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'published' }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ status: 'delisted' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'paid' }),
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'buyer' }),
      AgentActionLog.countDocuments(),
      AgentActionLog.countDocuments({ confirmedByUser: true }),
      Order.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Compute Gross Merchandise Value (GMV)
    const paidOrdersList = await Order.find({ status: 'paid' }).select('totalAmount').lean();
    const gmv = paidOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return NextResponse.json({
      metrics: {
        gmv,
        totalOrders,
        paidOrders,
        totalProducts,
        publishedProducts,
        draftProducts,
        delistedProducts,
        totalUsers,
        sellersCount,
        buyersCount,
        agentLogsCount,
        confirmedAgentActions,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
