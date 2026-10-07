'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard, { ProductCardData } from '@/components/ProductCard';
import { ShoppingCart, Zap, ArrowRight, Star, Package, TrendingUp, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'AI-Powered Listings', desc: 'Sellers list products from a single photo in under 2 minutes.' },
  { icon: ShoppingCart, title: 'Conversational Shopping', desc: 'Tell the AI what you need — it finds, compares, and checks out for you.' },
  { icon: Shield, title: 'Safe & Auditable', desc: 'Every AI action is logged. No payment or publish without your explicit OK.' },
  { icon: TrendingUp, title: 'Always Accurate', desc: 'Prices and stock are always sourced from live data — never hallucinated.' },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All', 'Electronics', 'Clothing', 'Footwear', 'Books', 'Home', 'Sports', 'Beauty']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/products/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch dynamic categories:', e);
    }
  }

  async function fetchProducts(category) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ featured: 'true', limit: '12' });
      if (category !== 'All') params.set('category', category);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ---- Hero ---- */}
      <section className="hero-bg" style={{ padding: '5rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)', pointerEvents: 'none' }} />

        <div className="page-container" style={{ textAlign: 'center', position: 'relative' }}>
          <div className="fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, padding: '6px 16px', marginBottom: '1.5rem' }}>
            <Zap size={13} color="var(--accent-bright)" fill="var(--accent-bright)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', fontWeight: 600 }}>AI-Powered Marketplace</span>
          </div>

          <h1 className="fade-in-delay-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '1.25rem' }}>
            Shop smarter.<br />
            <span className="gradient-text">Sell in seconds.</span>
          </h1>

          <p className="fade-in-delay-2" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Describe what you want — our AI finds it. Upload a photo — it&#39;s listed. ShopEZ is the marketplace where AI does the heavy lifting.
          </p>

          <div className="fade-in-delay-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/search" className="btn-glow" style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              Start Shopping <ArrowRight size={16} />
            </Link>
            <Link href="/seller/new" className="btn-outline" style={{ textDecoration: 'none', padding: '14px 28px', fontSize: '1rem' }}>
              List a Product
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
            {[['10K+', 'Products'], ['5K+', 'Sellers'], ['4.9★', 'Rating'], ['< 2min', 'List Time']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Featured Products ---- */}
      <section style={{ padding: '4rem 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label">Browse by Category</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>Live Seller Marketplace</h2>
            </div>
            <Link href="/search" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-bright)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
              View all products <ArrowRight size={14} />
            </Link>
          </div>

          {/* Dynamic Seller Categories */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 999,
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  transition: 'all 0.2s',
                  borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
                  background: activeCategory === cat ? 'var(--accent-glow)' : 'transparent',
                  color: activeCategory === cat ? 'var(--accent-bright)' : 'var(--text-muted)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.4, display: 'block' }} />
              <p>
                No products found in <strong>{activeCategory}</strong>. Be the first to <Link href="/seller/new" style={{ color: 'var(--accent-bright)' }}>list an item with AI</Link>!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {products.map((product) => (
                <ProductCard key={product._id || product.objectID} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Features ---- */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-secondary)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="section-label">Why ShopEZ</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>The smarter way to buy and sell</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card">
                <div style={{ width: 44, height: 44, background: 'var(--accent-glow)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Icon size={20} color="var(--accent-bright)" />
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem' }}>{title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="page-container">
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-xl)', padding: '4rem 2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Ready to list your first product?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
              Upload a photo and our AI generates a complete listing in seconds.
            </p>
            <Link href="/seller/new" className="btn-glow" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '1rem' }}>
              List a Product Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
