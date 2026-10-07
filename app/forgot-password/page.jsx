'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset link');

      setSubmitted(true);
      if (data.reset_url) setResetUrl(data.reset_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-bright)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <KeyRound size={24} color="var(--accent-bright)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Forgot password?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--emerald)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Reset link generated!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              We've dispatched a secure reset link for <strong>{email}</strong>.
            </p>

            {resetUrl && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>INSTANT RESET LINK:</div>
                <Link
                  href={resetUrl}
                  style={{ color: 'var(--accent-bright)', fontSize: '0.85rem', wordBreak: 'break-all', fontWeight: 600 }}
                >
                  Click here to Reset Your Password →
                </Link>
              </div>
            )}

            <Link href="/login" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '8px 20px', fontSize: '0.85rem' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Registered Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button type="submit" className="btn-glow" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Sending link...' : 'Send Password Reset Link'} <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={14} /> Return to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
