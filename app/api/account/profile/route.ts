import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import mongoose from 'mongoose';

async function resolveCurrentUser(session: any) {
  await connectDB();
  if (session?.user) {
    const userObj = session.user as { id?: string; email?: string };
    if (userObj.id && mongoose.Types.ObjectId.isValid(userObj.id)) {
      const u = await User.findById(userObj.id);
      if (u) return u;
    }
    if (userObj.email) {
      const u = await User.findOne({ email: userObj.email.toLowerCase() });
      if (u) return u;
    }
  }
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await resolveCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;
    let buyerMetrics: any = null;
    let sellerMetrics: any = null;

    if (user.role === 'buyer' || user.role === 'admin') {
      const [buyerOrders, totalOrdersCount] = await Promise.all([
        Order.find({ buyerId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
        Order.countDocuments({ buyerId: userId }),
      ]);

      const totalSpent = buyerOrders
        .filter((o: any) => o.status !== 'cancelled')
        .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

      const activeOrdersCount = buyerOrders.filter((o: any) =>
        ['paid', 'shipped'].includes(o.status)
      ).length;

      buyerMetrics = {
        totalOrdersCount,
        totalSpent,
        activeOrdersCount,
        recentOrders: buyerOrders,
      };
    }

    if (user.role === 'seller' || user.role === 'admin') {
      const [sellerProducts, totalProductsCount] = await Promise.all([
        Product.find({ sellerId: userId }).lean(),
        Product.countDocuments({ sellerId: userId }),
      ]);

      const productIds = new Set(sellerProducts.map((p) => p._id.toString()));
      const allOrders = await Order.find({
        status: { $in: ['paid', 'shipped', 'delivered'] },
      }).lean();

      let totalRevenue = 0;
      let totalUnitsSold = 0;

      for (const ord of allOrders) {
        const matching = (ord.items || []).filter((it: any) =>
          it.productId && productIds.has(it.productId.toString())
        );
        totalRevenue += matching.reduce((s: number, it: any) => s + it.price * it.qty, 0);
        totalUnitsSold += matching.reduce((s: number, it: any) => s + it.qty, 0);
      }

      sellerMetrics = {
        totalProductsCount,
        totalRevenue,
        totalUnitsSold,
        totalStockUnits: sellerProducts.reduce((sum, p) => sum + (p.stock || 0), 0),
      };
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        phone: user.phone || '+91 98765 43210',
        storeName: user.storeName || `${user.name}'s Official Store`,
        address: user.address || {
          line1: '12th Main, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
        createdAt: user.createdAt,
      },
      buyerMetrics,
      sellerMetrics,
    });
  } catch (error) {
    console.error('GET /api/account/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await resolveCurrentUser(session);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, phone, storeName, address } = await req.json();

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (storeName) user.storeName = storeName;
    if (address) {
      user.address = {
        line1: address.line1 || user.address?.line1 || '',
        line2: address.line2 || user.address?.line2 || '',
        city: address.city || user.address?.city || '',
        state: address.state || user.address?.state || '',
        postalCode: address.postalCode || user.address?.postalCode || '',
        country: address.country || user.address?.country || 'India',
      };
    }

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        storeName: user.storeName,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('PUT /api/account/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
