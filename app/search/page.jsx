'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard, { ProductCardData } from '@/components/ProductCard';
import { Search, SlidersHorizontal, Package, Sparkles } from 'lucide-react';
import AgentChat from '@/components/AgentChat';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState(['All', 'Electronics', 'Clothing', 'Footwear', 'Books', 'Home', 'Beauty', 'Sports']);
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAgent, setShowAgent] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    executeSearch();
  }, [category, maxPrice]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch categories:', e);
    }
  };

  const executeSearch = async (overrideQuery) => {
    setLoading(true);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      const params = new URLSearchParams();
      if (q) params.set('query', q);
      if (category !== 'All') params.set('category', category);
      if (maxPrice < 10000) params.set('max_price', maxPrice.toString());

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem 1rem' }}>
      {/* Top Search bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search thousands of products or describe what you need..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
            style={{ paddingLeft: '2.75rem', height: '48px', fontSize: '1rem' }}
          />
          <SearchIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        <button className="btn-glow" onClick={() => executeSearch()} style={{ height: '48px', padding: '0 1.5rem' }}>
          Search
        </button>
        <button
          className={showAgent ? 'btn-glow' : 'btn-outline'}
          onClick={() => setShowAgent(!showAgent)}
          style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          <Sparkles size={16} /> {showAgent ? 'Hide AI Agent' : 'Ask AI Agent'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showAgent ? '240px 1fr 360px' : '240px 1fr', gap: '2rem' }}>
        {/* Left Filter Sidebar */}
        <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontWeight: 700, fontSize: '1rem' }}>
            <SlidersHorizontal size={16} color="var(--accent-bright)" />
            Filters
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Category
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    background: category === cat ? 'var(--accent-glow)' : 'transparent',
                    color: category === cat ? 'var(--accent-bright)' : 'var(--text-muted)',
                    border: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: category === cat ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Price</label>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-bright)' }}>₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min={100}
              max={10000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Center Product Results */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{products.length}</strong> results in <strong>{category}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3>No products found</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Try selecting a different category or adjusting filters</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {products.map((p) => (
                <ProductCard key={p._id || p.objectID} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* Right embedded AI Shopping Agent */}
        {showAgent && (
          <div>
            <AgentChat role="buyer" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ padding: '3rem 1rem' }}><h2>Loading search...</h2></div>}>
      <SearchContent />
    </Suspense>
  );
}
