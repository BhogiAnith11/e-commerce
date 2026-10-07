'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, Tag, Sparkles, Filter, ChevronRight, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import AgentChat from '@/components/AgentChat';

export default function CategoryPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const categoryName = decodeURIComponent(slug)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minPrice, setMinPrice] = useState(0);
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug, maxPrice, minPrice, sort, inStockOnly]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('category', categoryName);
      if (maxPrice < 10000) searchParams.set('max_price', maxPrice.toString());
      if (minPrice > 0) searchParams.set('min_price', minPrice.toString());
      searchParams.set('sort', sort);

      const res = await fetch(`/api/products?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items = data.products || [];
        if (inStockOnly) {
          items = items.filter((p) => (p.stock || 0) > 0);
        }
        setProducts(items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2.5rem 1rem', minHeight: '90vh' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <Link href="/search" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Categories</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{categoryName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-bright)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
            <Tag size={14} /> CATEGORY STORE
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{categoryName}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Explore verified merchant products in {categoryName}.
          </p>
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ArrowUpDown size={16} color="var(--text-muted)" />
          <select
            className="input-field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="newest">Featured & Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Left Filter Sidebar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={16} color="var(--accent-bright)" /> Filters
          </h3>

          {/* Price Range Filter */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Max Price: <strong style={{ color: 'var(--text-primary)' }}>₹{maxPrice}</strong>
            </label>
            <input
              type="range"
              min={100}
              max={10000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>₹100</span>
              <span>₹10,000</span>
            </div>
          </div>

          {/* In-Stock Filter */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Center: Products Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Package size={56} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No products found in {categoryName}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Try adjusting your price filter or browse all products.
              </p>
              <Link href="/search" className="btn-glow" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontSize: '0.85rem' }}>
                Browse All Marketplace Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Embedded Buyer AI Agent */}
        <div>
          <AgentChat role="buyer" />
        </div>
      </div>
    </div>
  );
}
