'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Store,
  ShoppingBag,
  DollarSign,
  Box,
  Truck,
  ShieldCheck,
  Edit3,
  Save,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status: authStatus } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [buyerMetrics, setBuyerMetrics] = useState<any>(null);
  const [sellerMetrics, setSellerMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    storeName: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchProfile();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/account/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setBuyerMetrics(data.buyerMetrics);
        setSellerMetrics(data.sellerMetrics);

        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          storeName: data.user.storeName || '',
          line1: data.user.address?.line1 || '',
          city: data.user.address?.city || '',
          state: data.user.address?.state || '',
          postalCode: data.user.address?.postalCode || '',
        });
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          storeName: formData.storeName,
          address: {
            line1: formData.line1,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setIsEditing(false);
        await fetchProfile();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === 'unauthenticated') {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Lock size={26} color="var(--accent-bright)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign in to view your profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Manage your account settings, addresses, and track your purchase or sales history.
          </p>
          <Link href="/login" className="btn-glow" style={{ textDecoration: 'none', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Sign In Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="page-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 300, maxWidth: 800, margin: '0 auto', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const isSeller = profile.role === 'seller' || profile.role === 'admin';
  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'August 2026';

  return (
    <div className="page-container" style={{ padding: '3rem 1rem', minHeight: '90vh', maxWidth: 1000, margin: '0 auto' }}>
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="fade-in" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--emerald)', color: 'var(--emerald)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="card fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--border)', background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.08), transparent 70%), var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar / Profile Image */}
            <div style={{ position: 'relative' }}>
              {profile.image ? (
                <img src={profile.image} alt={profile.name} style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: isSeller ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #6366f1, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.75rem', fontWeight: 800, border: '2px solid rgba(255,255,255,0.1)' }}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--emerald)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }} title="Verified User">
                <ShieldCheck size={13} color="#fff" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{profile.name}</h1>
                <span className={`badge badge-${isSeller ? 'published' : 'draft'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '3px 10px' }}>
                  {isSeller ? '🏪 Verified Merchant' : '🛍️ Buyer Account'}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} /> {profile.email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> Member since {joinDate}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <Edit3 size={15} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--rose)', padding: '8px 14px' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Customized for Buyer or Seller */}
      {isSeller && sellerMetrics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--emerald)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Sales Revenue</span> <DollarSign size={16} color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--emerald)' }}>
              ₹{sellerMetrics.totalRevenue?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>From buyer orders</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Units Sold</span> <ShoppingBag size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: '#8b5cf6' }}>
              {sellerMetrics.totalUnitsSold || 0} Units
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Purchased by buyers</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-bright)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Listings</span> <Store size={16} color="var(--accent-bright)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--accent-bright)' }}>
              {sellerMetrics.totalProductsCount || 0} Products
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>In Storefront Catalog</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--gold)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Live Stock</span> <Box size={16} color="var(--gold)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--gold)' }}>
              {sellerMetrics.totalStockUnits || 0} Units
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Available in warehouse</div>
          </div>
        </div>
      ) : buyerMetrics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-bright)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Orders Placed</span> <ShoppingBag size={16} color="var(--accent-bright)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--accent-bright)' }}>
              {buyerMetrics.totalOrdersCount || 0} Orders
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Lifetime purchases</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--emerald)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Spent</span> <DollarSign size={16} color="var(--emerald)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--emerald)' }}>
              ₹{buyerMetrics.totalSpent?.toLocaleString('en-IN') || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Across all purchases</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Shipments</span> <Truck size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: '#f59e0b' }}>
              {buyerMetrics.activeOrdersCount || 0} In Transit
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Live delivery status</div>
          </div>

          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Shopper Status</span> <Award size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 6, color: '#8b5cf6' }}>
              ShopEZ Prime VIP
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Fast free delivery enabled</div>
          </div>
        </div>
      ) : null}

      {/* Main Details & Edit Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Personal & Account Information */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--accent-bright)" /> Personal Details
          </h2>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Phone Number</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {isSeller && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Store Brand Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                </div>
              )}

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={saving} className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FULL NAME</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMAIL ADDRESS</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PHONE</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.phone}</div>
              </div>
              {isSeller && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STORE NAME</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-bright)', marginTop: 2 }}>{profile.storeName}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Address Details */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--emerald)" /> {isSeller ? 'Business Dispatch Address' : 'Default Delivery Address'}
          </h2>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Street Address / Area</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>State</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Postal Code (PIN)</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STREET</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.address?.line1 || '12th Main, Indiranagar'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CITY</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.address?.city || 'Bengaluru'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATE</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.address?.state || 'Karnataka'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POSTAL PIN CODE</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.address?.postalCode || '560038'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COUNTRY</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{profile.address?.country || 'India'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Portals */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions & Shortcuts</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {isSeller ? (
            <>
              <Link href="/seller/dashboard" className="btn-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <Store size={16} /> Open Merchant Studio
              </Link>
              <Link href="/seller/new" className="btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <Sparkles size={16} /> + Add Product with AI
              </Link>
              <Link href="/account/orders" className="btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <Truck size={16} /> Track Buyer Orders
              </Link>
            </>
          ) : (
            <>
              <Link href="/account/orders" className="btn-glow" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <ShoppingBag size={16} /> View Order History
              </Link>
              <Link href="/cart" className="btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <Box size={16} /> View Cart
              </Link>
              <Link href="/search" className="btn-ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', padding: '10px 18px' }}>
                <Sparkles size={16} /> Explore Storefront
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
