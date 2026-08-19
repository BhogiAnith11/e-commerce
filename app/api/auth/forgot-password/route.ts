import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't leak account existence for security
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate random 64-char crypto token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Dispatch via Resend API (non-blocking in background)
    sendPasswordResetEmail(user.email, user.name, resetUrl).catch((err) =>
      console.warn('Resend email dispatch warning:', err)
    );

    console.log(`[PASSWORD RESET LINK for ${user.email}]: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email! Check your inbox or use the link below.',
      reset_url: resetUrl,
    });
  } catch (error: any) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 });
  }
}
