import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-07-29.dahlia',
});

export default stripe;

export async function createPaymentIntent(
  amount,
  currency = 'inr'?
){
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert to paise
    currency: || {},
    automatic_payment_methods: { enabled: true },
  });
}

export async function retrievePaymentIntent(id){
  return stripe.paymentIntents.retrieve(id);
}
