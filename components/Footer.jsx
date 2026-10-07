'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Globe, X, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/delivery')) {
    return null;
  }
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '3rem 0 2rem', marginTop: '4rem' }}>
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, background: 'var(--accent-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={17} color="white" fill="white" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Shop<span className="gradient-text">EZ</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 220 }}>
              AI-powered marketplace. List in seconds, shop conversationally.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            {[Globe, X, Heart].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--accent)'; (e.currentTarget).style.color = 'var(--accent-bright)'; }}
                  onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.color = 'var(--text-muted)'; }}>
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Shop</h4>
            {['All Products', 'Electronics', 'Clothing', 'Footwear', 'Books'].map(cat => (
              <Link key={cat} href={`/category/${cat.toLowerCase().replace(' ', '-')}`} style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {cat}
              </Link>
            ))}
          </div>

          {/* Sell */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Sell</h4>
            {[['Seller Dashboard', '/seller/dashboard'], ['New Listing', '/seller/new'], ['How It Works', '#']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {label}
              </Link>
            ))}
          </div>

          {/* Account */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Account</h4>
            {[['My Orders', '/account/orders'], ['Cart', '/cart'], ['Checkout', '/checkout'], ['Login', '/login']].map(([label, href]) => (
              <Link key={label} href={href} style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026 ShopEZ. All rights reserved.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Built with AI · Powered by Claude</p>
        </div>
      </div>
    </footer>
  );
}
