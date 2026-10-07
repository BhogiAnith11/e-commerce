'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, LogIn, Lock } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/mcp/orders/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || { items: [] });
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, qty) => {
    try {
      const res = await fetch('/api/mcp/orders/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, qty }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart({ ...cart, items: data.items });
      }
    } catch (e) {
      console.error('Failed to update cart:', e);
    }
  };

  const handleProceedToCheckout = () => {
    if (!session) {
      router.push('/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const subtotal = (cart?.items || []).reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingFee = subtotal > 0 ? 49 : 0;
  const total = subtotal + shippingFee;

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '3rem 1rem' }}>
        <h2>Loading your cart...</h2>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '3rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Your Shopping Cart</h1>
        {!session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Sign in to sync your cart across all devices:</span>
            <Link href="/login?callbackUrl=/cart" className="btn-outline" style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '0.8rem' }}>
              Sign In
            </Link>
          </div>
        )}
      </div>

      {!cart?.items || cart.items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ShoppingBag size={56} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h2>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link href="/search" className="btn-glow" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Explore Products <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
          {/* Item List */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {cart.items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.title}</h3>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-bright)', marginTop: '0.25rem' }}>₹{item.price}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '2px 8px' }}>
                      <button onClick={() => updateQuantity(item.productId, item.qty - 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>-</button>
                      <span style={{ padding: '0 0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>{item.qty}</span>
                      <button onClick={() => updateQuantity(item.productId, item.qty + 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>

                    <button onClick={() => updateQuantity(item.productId, 0)} className="btn-ghost" style={{ color: 'var(--rose)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping Fee</span>
                <span>₹{shippingFee}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="btn-glow"
              style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              {!session ? 'Sign In to Proceed to Checkout' : 'Proceed to Checkout'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
