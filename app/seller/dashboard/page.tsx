'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  PackageCheck,
  FileEdit,
  Trash2,
  TrendingUp,
  Sparkles,
  DollarSign,
  Box,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export default function SellerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ published: 0, draft: 0, delisted: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      const res = await fetch('/api/seller/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setStats(data.stats || { published: 0, draft: 0, delisted: 0, total: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelist = async (productId: string) => {
    if (!confirm('Are you sure you want to delist this product?')) return;
    try {
      const res = await fetch(`/api/seller/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSellerProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalInventoryUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalCatalogValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  return (
    <div className="page-container" style={{ padding: '2.5rem 1rem', minHeight: '90vh' }}>
      {/* Seller Central Brand Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Store size={14} /> SHOPEZ SELLER CENTRAL STUDIO
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Merchant Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor live catalog performance, sales velocity, and list products instantly with AI.
          </p>
        </div>

        <Link href="/seller/new" className="btn-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: '0.95rem' }}>
          <Sparkles size={18} /> + Add Product with AI
        </Link>
      </div>

      {/* Seller Central Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Active Live Listings</span>
            <PackageCheck size={18} color="var(--emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--emerald)' }}>{stats.published}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Visible on ShopEZ storefront</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-bright)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Units in Stock</span>
            <Box size={18} color="var(--accent-bright)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-bright)' }}>{totalInventoryUnits}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Ready for immediate dispatch</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Inventory Value</span>
            <DollarSign size={18} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--gold)' }}>₹{totalCatalogValue.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Based on current pricing</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Delisted / Inactive</span>
            <Trash2 size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#f43f5e' }}>{stats.delisted}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Delisted by merchant or admin</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Your Inventory & Product Catalog</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{products.length} product(s) registered</span>
        </div>

        {loading ? (
          <div>Loading your listings...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <Store size={52} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>No products listed yet</h3>
            <p style={{ marginTop: '0.5rem' }}>Upload a single photo and our AI agent will catalog it in seconds.</p>
            <Link href="/seller/new" className="btn-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: '1.25rem', textDecoration: 'none' }}>
              <Sparkles size={16} /> List Your First Product with AI →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Product Title</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Price</th>
                  <th style={{ padding: '0.75rem' }}>Stock</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box size={20} color="var(--text-muted)" />
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{p.title}</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{p.category}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{p.price.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.75rem' }}>{p.stock} units</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${p.status || 'published'}`}>{(p.status || 'published').toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link href={`/seller/products/${p._id}/edit`} className="btn-ghost" title="Edit Listing" style={{ padding: '6px' }}>
                          <FileEdit size={16} />
                        </Link>
                        {p.status !== 'delisted' && (
                          <button onClick={() => handleDelist(p._id)} className="btn-ghost" title="Delist Product" style={{ color: 'var(--rose)', padding: '6px' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
