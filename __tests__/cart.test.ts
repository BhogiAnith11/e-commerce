/**
 * cart.test.ts
 * Tests for cart logic: add, update quantity, remove, stock validation.
 * TDD §11: Unit tests per MCP tool (input validation, schema conformance).
 */

// ---- Helpers ---- //
interface CartItem {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  qty: number;
}

interface Cart {
  buyerId: string;
  items: CartItem[];
}

function addToCart(cart: Cart, product: { _id: string; title: string; imageUrl: string; price: number; stock: number }, qty: number): { cart?: Cart; error?: string } {
  if (product.stock < qty) {
    return { error: `Only ${product.stock} items in stock` };
  }
  const existing = cart.items.find(i => i.productId === product._id);
  if (existing) {
    if (product.stock < existing.qty + qty) {
      return { error: `Only ${product.stock} items in stock` };
    }
    existing.qty += qty;
  } else {
    cart.items.push({ productId: product._id, title: product.title, imageUrl: product.imageUrl, price: product.price, qty });
  }
  return { cart };
}

function updateCart(cart: Cart, productId: string, qty: number): { cart?: Cart; error?: string } {
  if (qty < 0) return { error: 'qty cannot be negative' };
  if (qty === 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return { error: 'Item not in cart' };
    item.qty = qty;
  }
  return { cart };
}

function cartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ---- Tests ---- //
describe('Cart — add_to_cart', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = { buyerId: 'user-1', items: [] };
  });

  it('adds a new item to an empty cart', () => {
    const product = { _id: 'p1', title: 'Shoes', imageUrl: 'img.jpg', price: 1999, stock: 10 };
    const result = addToCart(cart, product, 1);
    expect(result.error).toBeUndefined();
    expect(result.cart?.items).toHaveLength(1);
    expect(result.cart?.items[0].qty).toBe(1);
    expect(result.cart?.items[0].price).toBe(1999);
  });

  it('increments qty if item already in cart', () => {
    const product = { _id: 'p1', title: 'Shoes', imageUrl: 'img.jpg', price: 1999, stock: 10 };
    addToCart(cart, product, 2);
    const result = addToCart(cart, product, 3);
    expect(result.cart?.items[0].qty).toBe(5);
  });

  it('returns error when requested qty exceeds stock', () => {
    const product = { _id: 'p1', title: 'Shoes', imageUrl: 'img.jpg', price: 1999, stock: 2 };
    const result = addToCart(cart, product, 5);
    expect(result.error).toMatch(/Only 2 items in stock/);
    expect(result.cart).toBeUndefined();
  });

  it('returns error when adding more exceeds remaining stock', () => {
    const product = { _id: 'p1', title: 'Shoes', imageUrl: 'img.jpg', price: 1999, stock: 3 };
    addToCart(cart, product, 2);
    const result = addToCart(cart, product, 2); // 2+2=4 > 3
    expect(result.error).toMatch(/Only 3 items in stock/);
  });

  it('correctly computes cart total', () => {
    const p1 = { _id: 'p1', title: 'A', imageUrl: '', price: 500, stock: 10 };
    const p2 = { _id: 'p2', title: 'B', imageUrl: '', price: 250, stock: 10 };
    addToCart(cart, p1, 2);
    addToCart(cart, p2, 4);
    expect(cartTotal(cart)).toBe(2000); // 500*2 + 250*4
  });
});

describe('Cart — update_cart', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = {
      buyerId: 'user-1',
      items: [{ productId: 'p1', title: 'Shoes', imageUrl: '', price: 1999, qty: 2 }],
    };
  });

  it('updates qty of existing item', () => {
    const result = updateCart(cart, 'p1', 5);
    expect(result.cart?.items[0].qty).toBe(5);
  });

  it('removes item when qty is set to 0', () => {
    const result = updateCart(cart, 'p1', 0);
    expect(result.cart?.items).toHaveLength(0);
  });

  it('returns error for negative qty', () => {
    const result = updateCart(cart, 'p1', -1);
    expect(result.error).toBeDefined();
  });

  it('returns error if item is not in cart', () => {
    const result = updateCart(cart, 'non-existent', 2);
    expect(result.error).toMatch(/Item not in cart/);
  });
});
