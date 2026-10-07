import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/resend';

export async function POST(req) {
  try {
    const { email, password, name, role, phone, vehicleNumber, deliveryHub } = await req.json();

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'email, password, name, and role are required' },
        { status: 400 }
      );
    }

    if (!['seller', 'buyer', 'admin', 'delivery'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "seller", "buyer", "admin", or "delivery"' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await connectDB();

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: email.toLowerCase(),
      name: name.trim(),
      role,
      passwordHash,
      phone: phone || undefined,
      vehicleNumber: vehicleNumber || undefined,
      deliveryHub: deliveryHub || 'Bengaluru Central Hub KA-01',
    });

    // Send Welcome Email asynchronously via Resend
    sendWelcomeEmail(user.email, user.name, user.role).catch((err) =>
      console.warn('Resend welcome email warning:', err)
    );

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
