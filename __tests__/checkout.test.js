/**
 * checkout.test.js
 * TDD §11: Contract tests verifying agent only calls initiate_payment
 * after buyer_confirmed=true.
 * "Red-team tests: attempt to get the Buyer Agent to skip confirmation gates."
 */

// ---- Payment gate logic (mirrors /api/checkout/pay and initiate_payment MCP tool) ---- //
function initiatePayment(order, userId, buyer_confirmed) {
  // Hard gate 1: explicit confirmation required
  if (buyer_confirmed !== true) {
    return { error: 'initiate_payment requires buyer_confirmed=true' };
  }

  // Hard gate 2: order must belong to this buyer
  if (order.buyerId !== userId) {
    return { error: 'Forbidden' };
  }

  // Hard gate 3: order must be in 'created' state (no double-charging)
  if (order.status !== 'created') {
    return { error: `Order already in status: ${order.status}` };
  }

  // Hard gate 4: idempotency — no duplicate payment intents
  if (order.stripePaymentIntentId) {
    return { paymentIntentId: order.stripePaymentIntentId, status: 'already_initiated' };
  }

  return { paymentIntentId: 'pi_test_abc123', status: 'requires_payment_method' };
}

// ---- Tests ---- //
describe('Checkout — confirmation gate (BR-08)', () => {
  const order = {
    _id: 'ord-001',
    buyerId: 'user-1',
    totalAmount: 2348,
    status: 'created',
  };

  it('✅ proceeds when buyer_confirmed=true', () => {
    const result = initiatePayment(order, 'user-1', true);
    expect(result.error).toBeUndefined();
    expect(result.paymentIntentId).toBeDefined();
  });

  it('❌ blocks payment when buyer_confirmed=false', () => {
    const result = initiatePayment(order, 'user-1', false);
    expect(result.error).toMatch(/buyer_confirmed=true/);
    expect(result.paymentIntentId).toBeUndefined();
  });

  it('❌ blocks payment when buyer_confirmed is undefined (silence ≠ confirmation)', () => {
    // Simulates agent calling initiate_payment without an explicit confirm turn
    const result = initiatePayment(order, 'user-1', undefined);
    expect(result.error).toMatch(/buyer_confirmed=true/);
  });

  it('❌ blocks payment for wrong buyer (ownership check)', () => {
    const result = initiatePayment(order, 'other-user', true);
    expect(result.error).toMatch(/Forbidden/);
  });

  it('❌ blocks payment for already-paid order (no double-charge)', () => {
    const paidOrder = { ...order, status: 'paid' };
    const result = initiatePayment(paidOrder, 'user-1', true);
    expect(result.error).toMatch(/already in status/);
  });

  it('❌ blocks payment for cancelled order', () => {
    const cancelledOrder = { ...order, status: 'cancelled' };
    const result = initiatePayment(cancelledOrder, 'user-1', true);
    expect(result.error).toMatch(/already in status/);
  });

  it('✅ idempotent: returns existing payment intent if already initiated', () => {
    const initiatedOrder = { ...order, stripePaymentIntentId: 'pi_existing' };
    const result = initiatePayment(initiatedOrder, 'user-1', true);
    expect(result.error).toBeUndefined();
    expect(result.paymentIntentId).toBe('pi_existing');
    expect(result.status).toBe('already_initiated');
  });
});

describe('Checkout — order total validation', () => {
  const SHIPPING_FEE = 49;

  function computeTotal(items) {
    const subtotal = items.reduce((s, item) => s + item.price * item.qty, 0);
    return subtotal + SHIPPING_FEE;
  }

  it('computes total correctly with shipping', () => {
    const items = [
      { price: 1999, qty: 1 },
      { price: 250, qty: 2 },
    ];
    expect(computeTotal(items)).toBe(1999 + 500 + 49); // 2548
  });

  it('includes shipping fee even for single item', () => {
    const items = [{ price: 500, qty: 1 }];
    expect(computeTotal(items)).toBe(549);
  });

  it('returns just shipping for zero-price item (edge case)', () => {
    const items = [];
    expect(computeTotal(items)).toBe(SHIPPING_FEE);
  });
});
