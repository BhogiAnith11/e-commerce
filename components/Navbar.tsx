'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, Store, Package, LogOut, LogIn, Zap, ShieldCheck, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

async function fetchCartCount(): Promise<number> {
  const res = await fetch('/api/mcp/orders/cart');
  if (!res.ok) return 0;
  const data = await res.json();
  return (data.cart?.items || []).reduce((sum: number, item: { qty: number }) => sum + item.qty, 0);
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const { data: cartCount = 0 } = useQuery({
    queryKey: ['cartCount'],
    queryFn: fetchCartCount,
    refetchInterval: 8_000,
  });

  // Hide the standard Buyer navigation on the standalone Delivery Partner Portal
  if (pathname.startsWith('/delivery')) {
    return null;
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <nav
        style={{
          background: 'rgba(10, 15, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.625rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          minHeight: '68px',
        }}
      >
        {/* Left: Brand Logo & Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Shop<span className="gradient-text">EZ</span>
            </span>
          </Link>

          {/* Quick Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.9rem' }}>
            <Link href="/search" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
              Explore Products
            </Link>

            {/* Only show "Sell on ShopEZ" CTA to guests (not logged-in buyers or sellers) */}
            {!session && (
              <Link href="/seller/new" style={{ color: 'var(--accent-bright)', textDecoration: 'none', fontWeight: 600 }}>
                Sell on ShopEZ
              </Link>
            )}
          </div>
        </div>

        {/* Right Nav Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Admin Navigation — Only shown if Admin */}
          {role === 'admin' && (
            <Link
              href="/admin"
              className="btn-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                padding: '7px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={16} /> Admin Portal
            </Link>
          )}

          {/* Seller Navigation — Only shown if Seller */}
          {role === 'seller' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                href="/seller/dashboard"
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  padding: '7px 12px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <Store size={16} /> Dashboard
              </Link>
              <Link
                href="/seller/new"
                className="btn-glow"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                }}
              >
                <Package size={15} /> + List Product
              </Link>
            </div>
          )}

          {/* Buyer Returns & Orders */}
          {role !== 'seller' && (
            <Link
              href="/account/orders"
              className="btn-ghost"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <Package size={16} /> Your Orders
            </Link>
          )}

          {/* Shopping Cart */}
          {role !== 'seller' && (
            <Link
              href="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={18} color="var(--text-primary)" />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -10,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: 999,
                      padding: '1px 6px',
                    }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>Cart</span>
            </Link>
          )}

          {/* User Profile / Auth Actions */}
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
                title="View & Edit Profile"
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: role === 'seller' ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #6366f1, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.2, textAlign: 'left' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{session.user?.name?.split(' ')[0] || 'User'}</div>
                  <div style={{ color: 'var(--accent-bright)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}>
                    {role === 'seller' ? '🏪 Merchant' : '🛍️ Buyer'}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Sign Out"
                className="btn-ghost"
                style={{ padding: '6px', color: 'var(--text-muted)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/login" className="btn-outline" style={{ textDecoration: 'none', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <LogIn size={15} /> Login
              </Link>
              <Link href="/signup" className="btn-glow" style={{ textDecoration: 'none', padding: '7px 16px', fontSize: '0.85rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
