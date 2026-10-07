import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

/**
 * Creates a Razorpay Order in paise (1 INR = 100 paise)
 */
export async function createRazorpayOrder(amountInRupees, receiptId) {
  const options = {
    amount: Math.round(amountInRupees * 100), // Amount in paise
    currency: 'INR',
    receipt: receiptId,
    payment_capture: 1,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verifies Razorpay payment signature
 */
export function verifyRazorpaySignature(
  orderId,
  paymentId,
  signature
){
  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}
