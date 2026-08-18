'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  User,
  Package,
  CheckCircle2,
  Lock,
  MapPin,
  Clock,
  Heart,
  Share2,
} from 'lucide-react';
import AgentChat from '@/components/AgentChat';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const res = await fetch('/api/mcp/orders/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, qty }),
      });
      if (res.ok) {
        setCartSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['cartCount'] });
        setTimeout(() => setCartSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Add to cart failed:', e);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '3rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: '2rem' }}>
          <div className="skeleton" style={{ height: 480, borderRadius: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: 40, width: '80%' }} />
            <div className="skeleton" style={{ height: 30, width: '40%' }} />
            <div className="skeleton" style={{ height: 180 }} />
          </div>
          <div className="skeleton" style={{ height: 360, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
      </div>
    );
  }

  const mrp = Math.round(product.price * 1.38);
  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

  return (
    <div className="page-container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Product Image & Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card"
            style={{
              padding: '1rem',
              overflow: 'hidden',
              position: 'relative',
              height: '460px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                style={{ objectFit: 'contain', padding: '1rem', transition: 'transform 0.3s ease' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={64} color="var(--text-muted)" />
              </div>
            )}
            <button
              onClick={() => alert('Saved to your Wishlist!')}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Heart size={18} color="#fff" />
            </button>
          </div>
        </div>

        {/* Center: Amazon-style Product Specs & Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', fontWeight: 600, textTransform: 'uppercase' }}>
              Brand: {product.sellerId?.name || 'ShopEZ Verified Merchant'}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.3, marginTop: 4 }}>
              {product.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={15} color="#f59e0b" fill="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-bright)', fontWeight: 600 }}>4.8 out of 5 stars</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>| 1,248 global ratings</span>
            </div>
          </div>

          {/* Amazon Price Section */}
          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700 }}>-{discountPercent}%</span>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{product.price.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
              M.R.P.: <span style={{ textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600, marginTop: 4 }}>
              Inclusive of all taxes • EMI options available
            </div>
          </div>

          {/* Amazon Highlights & Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <Truck size={20} color="var(--accent-bright)" style={{ margin: '0 auto 4px' }} />
              <div>Free Delivery</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <RotateCcw size={20} color="var(--emerald)" style={{ margin: '0 auto 4px' }} />
              <div>7 Days Replacement</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
              <ShieldCheck size={20} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
              <div>Top Brand Warranty</div>
            </div>
          </div>

          {/* About this item */}
          <div style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>About this item</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{product.description}</p>
          </div>
        </div>

        {/* Right: Amazon Buy Box */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            border: '1px solid #30363d',
            background: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>FREE delivery</span> by{' '}
              <strong>Thursday, 3 Business Days</strong>.
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="var(--accent-bright)" /> Deliver to Rahul - Bengaluru 560038
            </div>
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald)' }}>
            In Stock
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div>Ships from: <strong style={{ color: '#fff' }}>ShopEZ Express</strong></div>
            <div>Sold by: <strong style={{ color: 'var(--accent-bright)' }}>{product.sellerId?.name || 'Verified Seller'}</strong></div>
            <div>Payment: <strong style={{ color: '#fff' }}>Paytm / UPI / Cards</strong></div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Quantity:
            </label>
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                color: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: '0.85rem',
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Amazon CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
            {/* Yellow Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              style={{
                background: '#ffd814',
                color: '#0f1111',
                border: '1px solid #fcd200',
                borderRadius: 999,
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <ShoppingCart size={16} />
              {cartSuccess ? '✓ Added to Cart!' : addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* Orange Buy Now Button */}
            <button
              onClick={handleBuyNow}
              style={{
                background: '#ffa41c',
                color: '#0f1111',
                border: '1px solid #ff8f00',
                borderRadius: 999,
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Zap size={16} fill="#0f1111" />
              Buy Now
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center', marginTop: 4 }}>
            <Lock size={12} /> Secure transaction
          </div>
        </div>
      </div>

      {/* AI Concierge Assistant Floating / Bottom */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={18} color="var(--accent-bright)" /> Ask AI Shopping Assistant about this product
        </h2>
        <div style={{ maxWidth: '600px' }}>
          <AgentChat role="buyer" productId={productId} />
        </div>
      </div>
    </div>
  );
}
