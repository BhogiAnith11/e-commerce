/**
 * ShopEZ Resend Email Integration Helper
 */

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set. Skipping email dispatch.');
    return { success: false, reason: 'missing_api_key' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShopEZ <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('[Resend Email Error]:', data);
      return { success: false, error: data };
    }

    console.log(`[Resend] Successfully dispatched email to ${to} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Resend Exception]:', error);
    return { success: false, error };
  }
}

/**
 * 1. Password Reset Verification Email
 */
export async function sendPasswordResetEmail(to, name, resetUrl) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Shop<span style="color: #38bdf8;">EZ</span></h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security & Account Services</p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px;">Password Reset Request</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Hello <strong>${name || 'Shopper'}</strong>,<br/>
        We received a request to reset your ShopEZ account password. Click the button below to set a new password:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          Reset Password →
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
        Or copy and paste this secure URL directly into your browser:<br/>
        <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
      </p>

      <div style="border-top: 1px solid #334155; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
        This password reset link is valid for 1 hour. If you didn't request this, you can safely ignore this email.
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: '🔐 Reset Your ShopEZ Password',
    html,
  });
}

/**
 * 2. Order Confirmation & Receipt Email
 */
export async function sendOrderConfirmationEmail(to, name, order) {
  const itemsHtml = (order.items || [])
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 12px 0; color: #f8fafc; font-size: 14px; font-weight: 600;">${it.title} (x${it.qty})</td>
        <td style="padding: 12px 0; color: #10b981; font-size: 14px; font-weight: 700; text-align: right;">₹${(it.price * it.qty).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0;">Shop<span style="color: #38bdf8;">EZ</span></h1>
        <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-top: 8px;">
          ✓ Order Confirmed #${order._id?.slice(-8) || ''}
        </div>
      </div>

      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Thank you for your order, <strong>${name || 'Customer'}</strong>! We've received your payment and our fulfillment team is preparing your package for dispatch.
      </p>

      <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #475569; color: #94a3b8; font-size: 12px; text-transform: uppercase;">
              <th style="text-align: left; padding-bottom: 8px;">Item</th>
              <th style="text-align: right; padding-bottom: 8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 12px; font-weight: 700; color: #f8fafc; font-size: 15px;">Total Paid (${order.paymentMethod || 'Razorpay / UPI'})</td>
              <td style="padding-top: 12px; font-weight: 800; color: #38bdf8; font-size: 16px; text-align: right;">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">
        <strong>Delivery Address:</strong><br/>
        ${order.shippingAddress?.line1 || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.postalCode || ''}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/account/orders" style="background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">
          Track Order with Live GPS →
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `📦 Order Confirmation #${order._id?.slice(-8) || ''} — ShopEZ`,
    html,
  });
}

/**
 * 3. Order Cancellation & Refund Email
 */
export async function sendOrderCancelledEmail(to, name, order) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0;">Shop<span style="color: #38bdf8;">EZ</span></h1>
        <div style="display: inline-block; background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid #f43f5e; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-top: 8px;">
          Order Cancelled #${order._id?.slice(-8) || ''}
        </div>
      </div>

      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Hello <strong>${name || 'Shopper'}</strong>,<br/>
        Your cancellation request for Order <strong>#${order._id?.slice(-8) || ''}</strong> has been processed successfully.
      </p>

      <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <div style="font-size: 13px; color: #94a3b8;">Refund Amount:</div>
        <div style="font-size: 22px; font-weight: 800; color: #10b981; margin-top: 4px;">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
          Refund initiated to original payment method (${order.paymentMethod || 'Razorpay / UPI'}). Please allow 1-2 business days for your bank to reflect the credit.
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🔴 Order Cancellation & Refund Confirmed #${order._id?.slice(-8) || ''} — ShopEZ`,
    html,
  });
}

/**
 * 4. Welcome to ShopEZ Email
 */
export async function sendWelcomeEmail(to, name, role) {
  const isSeller = role === 'seller';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; font-size: 26px; font-weight: 800; margin: 0;">Welcome to Shop<span style="color: #38bdf8;">EZ</span>!</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">AI-Powered Autonomous E-Commerce Platform</p>
      </div>

      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
        Hello <strong>${name}</strong>,<br/>
        Welcome aboard! Your ${isSeller ? 'Merchant Central Seller' : 'Shopper'} account is active and verified.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${isSeller ? 'seller/dashboard' : 'search'}" style="background: linear-gradient(135deg, #6366f1, #38bdf8); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">
          ${isSeller ? 'Open Merchant Central →' : 'Explore Storefront →'}
        </a>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `🎉 Welcome to ShopEZ, ${name}!`,
    html,
  });
}
