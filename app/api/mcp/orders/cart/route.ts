import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import User from '@/models/User';
import mongoose from 'mongoose';

async function resolveBuyerId(session: any, req: NextRequest): Promise<mongoose.Types.ObjectId> {
  await connectDB();

  // 1. If logged in with id
  if (session?.user?.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
    return new mongoose.Types.ObjectId(session.user.id);
  }

  // 2. If logged in with email
  if (session?.user?.email) {
    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (user) return user._id;
  }

  // 3. Fallback persistent guest user for shopping cart
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

// GET /api/mcp/orders/cart — get current cart
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(session, req);

    const cart = await Cart.findOne({ buyerId }).lean();
    return NextResponse.json({ cart: cart || { items: [] } });
  } catch (error) {
    console.error('GET cart error:', error);
    return NextResponse.json({ cart: { items: [] } });
  }
}

// POST /api/mcp/orders/cart — add_to_cart
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(session, req);

    const { product_id, qty = 1 } = await req.json();
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const product = await Product.findById(product_id);
    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Product not found or not available' }, { status: 404 });
    }

    const availableStock = product.stock ?? 10;
    if (availableStock < qty) {
      return NextResponse.json({ error: `Only ${availableStock} items in stock` }, { status: 400 });
    }

    let cart = await Cart.findOne({ buyerId });
    if (!cart) {
      cart = new Cart({ buyerId, items: [] });
    }

    const existingIdx = cart.items.findIndex(
      (item) => item.productId.toString() === product_id
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].qty += qty;
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(product_id),
        title: product.title,
        imageUrl: product.imageUrl || '',
        price: product.price,
        qty,
      });
    }

    await cart.save();
    return NextResponse.json({ cart_id: cart._id.toString(), items: cart.items });
  } catch (error) {
    console.error('add_to_cart error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// PATCH /api/mcp/orders/cart — update_cart
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(session, req);

    const { product_id, qty } = await req.json();
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const cart = await Cart.findOne({ buyerId });
    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    if (qty <= 0) {
      cart.items = cart.items.filter((item) => item.productId.toString() !== product_id);
    } else {
      const item = cart.items.find((item) => item.productId.toString() === product_id);
      if (item) item.qty = qty;
    }

    await cart.save();
    return NextResponse.json({ cart_id: cart._id.toString(), items: cart.items });
  } catch (error) {
    console.error('PATCH cart error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

// DELETE /api/mcp/orders/cart — clear cart
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    const buyerId = await resolveBuyerId(session, req);

    await Cart.findOneAndDelete({ buyerId });
    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
