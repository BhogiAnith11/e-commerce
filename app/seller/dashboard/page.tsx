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
  ShoppingBag,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Smartphone,
  Phone,
  RefreshCw,
} from 'lucide-react';

export default function SellerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ published: 0, draft: 0, delisted: 0, total: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [orderMetrics, setOrderMetrics] = useState({ totalRevenue: 0, totalUnitsSold: 0, totalOrdersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch seller's products
      const pRes = await fetch('/api/seller/products');
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData.products || []);
        setStats(pData.stats || { published: 0, draft: 0, delisted: 0, total: 0 });
      }

      // 2. Fetch orders placed by buyers for this seller's products
      const oRes = await fetch('/api/seller/orders');
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders || []);
        setOrderMetrics(oData.metrics || { totalRevenue: 0, totalUnitsSold: 0, totalOrdersCount: 0 });
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelist = async (productId: string) => {
    if (!confirm('Are you sure you want to delist this product?')) return;
    try {
      const res = await fetch(`/api/seller/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
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
            Live sales revenue, customer orders, inventory stock, and AI product listing studio.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn-ghost" style={{ padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <Link href="/seller/new" className="btn-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: '0.95rem' }}>
            <Sparkles size={18} /> + Add Product with AI
          </Link>
        </div>
      </div>

      {/* Seller Central Key KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* 1. Total Revenue Earned from Buyer Orders */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Sales Revenue</span>
            <DollarSign size={18} color="var(--emerald)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--emerald)' }}>
            ₹{orderMetrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            From {orderMetrics.totalOrdersCount} customer order(s)
          </div>
        </div>

        {/* 2. Units Sold to Buyers */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Units Sold</span>
            <ShoppingBag size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#8b5cf6' }}>
            {orderMetrics.totalUnitsSold} Units
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Purchased by buyers</div>
        </div>

        {/* 3. Live Inventory in Stock */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-bright)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Remaining Live Stock</span>
            <Box size={18} color="var(--accent-bright)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent-bright)' }}>
            {totalInventoryUnits} Units
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Across {stats.published} active listing(s)</div>
        </div>

        {/* 4. Total Catalog Valuation */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Active Catalog Value</span>
            <TrendingUp size={18} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--gold)' }}>
            ₹{totalCatalogValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Ready for sale on storefront</div>
        </div>
      </div>

      {/* SECTION 1: Orders Placed by Buyers */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={20} color="var(--accent-bright)" /> Orders Placed for Your Products ({orders.length})
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Customer purchases reflecting in real-time from buyer checkout.
            </p>
          </div>
        </div>

        {loading ? (
          <div>Loading customer orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>No buyer orders yet</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              When buyers complete checkout on your products, customer orders and delivery dispatch details will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div
                key={order._id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDER ID</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{order._id.slice(-8)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BUYER</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{order.buyerName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHIP TO</div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="var(--accent-bright)" /> {order.city}, {order.state} - {order.postalCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL PAID</div>
                    <div style={{ fontWeight: 800, color: order.status === 'cancelled' ? 'var(--text-muted)' : 'var(--emerald)', fontSize: '0.95rem', textDecoration: order.status === 'cancelled' ? 'line-through' : 'none' }}>
                      ₹{order.totalPaid.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYMENT</div>
                    <div style={{ fontSize: '0.8rem', color: order.status === 'cancelled' ? 'var(--rose)' : 'var(--emerald)', fontWeight: 600 }}>
                      {order.status === 'cancelled' ? 'Refunded' : order.paymentMethod}
                    </div>
                  </div>
                  <div>
                    <span className={`badge badge-${order.status === 'paid' ? 'published' : order.status === 'delivered' ? 'published' : order.status === 'cancelled' ? 'delisted' : 'draft'}`}>
                      {order.status === 'cancelled' ? '🔴 CANCELLED BY BUYER' : order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Ordered Items & Dispatch Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {order.items?.map((it: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                        {it.imageUrl && <img src={it.imageUrl} alt={it.title} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />}
                        <span style={{ fontWeight: 600 }}>{it.title}</span>
                        <span style={{ color: 'var(--text-muted)' }}>x{it.qty}</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-bright)' }}>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dispatch Action Buttons or Restocked Indicator */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {order.status === 'cancelled' ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(16,185,129,0.3)' }}>
                        ✓ Stock restored to inventory
                      </span>
                    ) : (
                      <>
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'shipped')}
                            disabled={updatingOrderId === order._id}
                            className="btn-outline"
                            style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-bright)' }}
                          >
                            🚚 Mark as Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                            disabled={updatingOrderId === order._id}
                            className="btn-glow"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            ✓ Mark as Delivered
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Products Table */}
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
                  <th style={{ padding: '0.75rem' }}>Live Stock</th>
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
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: (p.stock || 0) > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                        {p.stock} units
                      </span>
                    </td>
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
