'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Bot,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Send,
  PieChart,
  BarChart2,
} from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'Footwear', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // AI Category Summarizer State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customPrompt, setCustomPrompt] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summaryReport, setSummaryReport] = useState(null);

  useEffect(() => {
    loadAdminData();
    generateCategorySummary('All');
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodRes, ordRes, logsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/agent-logs'),
        fetch('/api/admin/users'),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).metrics);
      if (prodRes.ok) setProducts((await prodRes.json()).products || []);
      if (ordRes.ok) setOrders((await ordRes.json()).orders || []);
      if (logsRes.ok) setAgentLogs((await logsRes.json()).logs || []);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateCategorySummary = async (cat, prompt) => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/admin/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, prompt: prompt || customPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryReport(data);
      }
    } catch (e) {
      console.error('Failed to generate summary:', e);
    } finally {
      setSummarizing(false);
    }
  };

  const handleProductStatusChange = async (productId, newStatus: 'published' | 'delisted' | 'draft') => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, status: newStatus } : p))
        );
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container" style={{ padding: '2.5rem 1rem', minHeight: '90vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid var(--accent)', color: 'var(--accent-bright)', padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> PLATFORM GOVERNANCE & AI ANALYTICS
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Operations Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor live marketplace data, summarize category metrics with AI, and oversee AI agent actions.
          </p>
        </div>

        <button onClick={loadAdminData} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1rem' }}>
          <RefreshCw size={15} /> Refresh Live Data
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Marketplace GMV', value: `₹${stats?.gmv?.toLocaleString() || 0}`, icon: TrendingUp, color: 'var(--emerald)' },
          { label: 'Live Catalog Items', value: stats?.publishedProducts || 0, icon: Package, color: 'var(--accent-bright)' },
          { label: 'Completed Orders', value: stats?.paidOrders || 0, icon: ShoppingCart, color: 'var(--gold)' },
          { label: 'AI Tool Actions', value: stats?.agentLogsCount || 0, icon: Bot, color: '#ec4899' },
          { label: 'Registered Users', value: stats?.totalUsers || 0, icon: Users, color: '#38bdf8' },
        ].map((m) => (
          <div key={m.label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</span>
              <m.icon size={18} color={m.color} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '📊 Overview', count },
          { id: 'summarizer', label: '🧠 AI Category Summarizer', count: 'NEW' },
          { id: 'agents', label: '🤖 AI Agent Activity', count: agentLogs.length },
          { id: 'products', label: '📦 Product Catalog', count: products.length },
          { id: 'orders', label: '🛒 Orders & Revenue', count: orders.length },
          { id: 'users', label: '👥 User Directory', count: users.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={activeTab === t.id ? 'btn-glow' : 'btn-ghost'}
            style={{ padding: '0.625rem 1.25rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>{t.label}</span>
            {t.count !== null && (
              <span style={{ background: t.count === 'NEW' ? 'var(--emerald)' : 'rgba(255,255,255,0.15)', color: t.count === 'NEW' ? '#000' : 'inherit', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Marketplace Transactions</h2>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>No orders recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order #{ord._id ? ord._id.slice(-6) : 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Buyer: {ord.buyerId?.name || 'Customer'} • {ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString() : 'Recent'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--accent-bright)' }}>₹{ord.totalAmount}</div>
                      <span className={`badge badge-${ord.status === 'paid' ? 'published' : 'draft'}`}>
                        {(ord.status || 'created').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={18} color="var(--accent-bright)" /> AI Agent Guardrails
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Seller Publish Gate (BR-04)</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>ACTIVE (100% Enforced)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Buyer Payment Gate (BR-08)</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>ACTIVE (100% Enforced)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>Live Catalog Grounding</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Total Audited Tool Turns</span>
                <span style={{ fontWeight: 700 }}>{stats?.agentLogsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Category Summarizer */}
      {activeTab === 'summarizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls Bar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={20} color="var(--accent-bright)" /> AI Marketplace Category Intelligence
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Select a category to aggregate live database metrics and have Claude synthesize an executive health report.
                </p>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      generateCategorySummary(cat);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: `1px solid ${selectedCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
                      background: selectedCategory === cat ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      color: selectedCategory === cat ? 'var(--accent-bright)' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Query Input */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder={`Ask AI a specific question about ${selectedCategory} (e.g. Is our inventory healthy? Recommend promotion ideas...)`}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateCategorySummary(selectedCategory, customPrompt)}
              />
              <button
                className="btn-glow"
                disabled={summarizing}
                onClick={() => generateCategorySummary(selectedCategory, customPrompt)}
                style={{ padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <Sparkles size={16} />
                {summarizing ? 'Analyzing...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Report Display */}
          {summarizing ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '1rem' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <h3>AI Agent is analyzing live database metrics for {selectedCategory}...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Aggregating GMV, stock levels, pricing variance, and merchant velocity.</p>
            </div>
          ) : summaryReport ? (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
              {/* Category Live Metric Numbers */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  📊 {summaryReport.category} Live Metrics
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Listings:</span>
                  <span style={{ fontWeight: 700 }}>{summaryReport.metrics?.totalListings}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Published:</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>{summaryReport.metrics?.publishedListings}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Inventory Units:</span>
                  <span style={{ fontWeight: 700 }}>{summaryReport.metrics?.totalInventoryUnits}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Average Price:</span>
                  <span style={{ color: 'var(--accent-bright)', fontWeight: 700 }}>{summaryReport.metrics?.averageListingPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price Range:</span>
                  <span style={{ fontWeight: 700 }}>{summaryReport.metrics?.priceRange}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Category Revenue:</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{summaryReport.metrics?.estimatedCategoryRevenue}</span>
                </div>
              </div>

              {/* AI Markdown Report Card */}
              <div className="card fade-in" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <Bot size={22} color="var(--accent-bright)" />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Executive Category Intelligence Report</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--emerald)' }}>Synthesized from live database records</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                  {summaryReport.summary}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: AI Agent Monitor */}
      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedLog ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Live MCP Agent Tool Call Logs</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click any row to inspect inputs/outputs</span>
            </div>

            {agentLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No AI Agent tool calls logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {agentLogs.map((log) => (
                  <div
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: selectedLog?._id === log._id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedLog?._id === log._id ? 'var(--accent)' : 'var(--border)'}`,
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="badge badge-published">{log.toolName}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Session: {log.sessionId ? log.sessionId.slice(0, 12) : 'anon'}...</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {log.confirmedByUser ? (
                        <span style={{ color: 'var(--emerald)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> User Confirmed
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Automated Query</span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspect Tool Drawer */}
          {selectedLog && (
            <div className="card fade-in" style={{ padding: '1.5rem', border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tool Payload Inspector</h3>
                <button onClick={() => setSelectedLog(null)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Close</button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tool Name</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-bright)' }}>{selectedLog.toolName}</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Input Parameters:</div>
                <pre style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto', border: '1px solid var(--border)' }}>
                  {JSON.stringify(selectedLog.input, null, 2)}
                </pre>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tool Execution Result:</div>
                <pre style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 8, fontSize: '0.8rem', overflowX: 'auto', border: '1px solid var(--border)' }}>
                  {JSON.stringify(selectedLog.output, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Product Moderation */}
      {activeTab === 'products' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Marketplace Product Moderation</h2>
            <Link href="/seller/new" className="btn-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
              <Sparkles size={15} /> Add Listing via AI
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No products in the catalog. Sellers can list products with AI or manual forms.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Product</th>
                    <th style={{ padding: '0.75rem' }}>Seller</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Price</th>
                    <th style={{ padding: '0.75rem' }}>Stock</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: 'var(--bg-secondary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} />
                          </div>
                        )}
                        <span style={{ fontWeight: 600 }}>{p.title}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{p.sellerId?.name || 'Seller'}</td>
                      <td style={{ padding: '0.75rem' }}>{p.category}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>₹{p.price}</td>
                      <td style={{ padding: '0.75rem' }}>{p.stock}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${p.status || 'published'}`}>{(p.status || 'published').toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          {p.status !== 'published' && (
                            <button onClick={() => handleProductStatusChange(p._id, 'published')} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--emerald)' }}>
                              Approve
                            </button>
                          )}
                          {p.status === 'published' && (
                            <button onClick={() => handleProductStatusChange(p._id, 'delisted')} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--rose)' }}>
                              Delist
                            </button>
                          )}
                          <button onClick={() => handleDeleteProduct(p._id)} className="btn-ghost" style={{ color: 'var(--rose)', padding: '4px 6px' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Orders & Revenue */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>All Buyer Orders & Payments</h2>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No customer orders placed yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Order ID</th>
                    <th style={{ padding: '0.75rem' }}>Buyer</th>
                    <th style={{ padding: '0.75rem' }}>Items</th>
                    <th style={{ padding: '0.75rem' }}>Total Amount</th>
                    <th style={{ padding: '0.75rem' }}>Payment Status</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>#{o._id ? o._id.slice(-6) : 'N/A'}</td>
                      <td style={{ padding: '0.75rem' }}>{o.buyerId?.name || 'Guest Buyer'}</td>
                      <td style={{ padding: '0.75rem' }}>{o.items?.length || 0} product(s)</td>
                      <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--accent-bright)' }}>₹{o.totalAmount}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${o.status === 'paid' ? 'published' : 'draft'}`}>{(o.status || 'created').toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Users */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Marketplace User Directory</h2>
          {users.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No users registered.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>User Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${u.role === 'admin' ? 'published' : u.role === 'seller' ? 'draft' : 'delisted'}`}>
                          {(u.role || 'buyer').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
