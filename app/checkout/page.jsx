'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  MapPin,
  Smartphone,
  Building2,
  Banknote,
  Navigation,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useSession } from 'next-auth/react';
import Link from 'next/link';


export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const [address, setAddress] = useState({
    name: 'Rahul Kumar',
    phone: '9876543210',
    line1: '123 MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'IN',
  });

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [orderCreated, setOrderCreated] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifiedPaymentId, setVerifiedPaymentId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [cartRes, profileRes] = await Promise.all([
          fetch('/api/mcp/orders/cart'),
          fetch('/api/account/profile'),
        ]);

        if (cartRes.ok) {
          const data = await cartRes.json();
          setCart(data.cart || { items: [] });
        }

        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData?.user) {
            const u = pData.user;
            setAddress((prev) => ({
              ...prev,
              name: u.name || prev.name,
              phone: u.phone || prev.phone,
              line1: u.address?.line1 || prev.line1,
              city: u.address?.city || prev.city,
              state: u.address?.state || prev.state,
              postalCode: u.address?.postalCode || prev.postalCode,
            }));
          }
        }
      } catch (e) {
        console.error('Checkout data load error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let resolved = false;

        // 1. Try Google Maps Geocoding API if key available
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (googleApiKey) {
          try {
            const gRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`);
            const gData = await gRes.json();
            if (gData.status === 'OK' && gData.results?.[0]) {
              const result = gData.results[0];
              let street = '';
              let city = 'Bengaluru';
              let state = 'Karnataka';
              let postalCode = '560038';

              for (const comp of result.address_components || []) {
                if (comp.types.includes('route') || comp.types.includes('sublocality')) street += (street ? ', ' : '') + comp.long_name;
                if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) city = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                if (comp.types.includes('postal_code')) postalCode = comp.long_name;
              }

              setAddress((prev) => ({
                ...prev,
                line1: street || result.formatted_address?.split(',')[0] || 'Detected Address',
                city,
                state,
                postalCode,
              }));
              resolved = true;
              setLocationSuccess(true);
              setTimeout(() => setLocationSuccess(false), 3000);
            }
          } catch (gErr) {
            console.warn('Google Maps API geocode error:', gErr);
          }
        }

        // 2. OpenStreetMap fallback
        if (!resolved) {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const street = addr.road || addr.suburb || addr.neighbourhood || 'Live Location Street';
              const city = addr.city || addr.town || addr.state_district || 'Bengaluru';
              const state = addr.state || 'Karnataka';
              const postalCode = addr.postcode || '560038';

              setAddress((prev) => ({
                ...prev,
                line1: `${street}, ${data.display_name?.split(',')[0] || ''}`.trim(),
                city,
                state,
                postalCode,
              }));
              setLocationSuccess(true);
              setTimeout(() => setLocationSuccess(false), 3000);
            } else {
              throw new Error('Reverse geocode failed');
            }
          } catch {
            setAddress((prev) => ({
              ...prev,
              line1: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560038',
            }));
            setLocationSuccess(true);
          }
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Location permission denied or unavailable. You can enter details manually.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const subtotal = (cart?.items || []).reduce((acc, item) => acc + item.price * item.qty, 0);
  const total = subtotal + (subtotal > 0 ? 49 : 0);

  // Step 1: Initialize Order
  const handleReviewOrder = async () => {
    setError('');
    if (!address.name.trim() || !address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) {
      setError('Please fill in all required shipping address fields.');
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipping_address: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize order');
      setOrderCreated(data);
    } catch (e) {
      setError(e.message);
    }
  };

  // Step 2: Pay with Razorpay / COD
  const handleRazorpayPayment = async () => {
    if (!orderCreated?.order_id) return;
    setIsPaying(true);
    setError('');

    // If Cash on Delivery
    if (paymentMethod === 'COD') {
      try {
        const res = await fetch('/api/checkout/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderCreated.order_id,
            buyer_confirmed: true,
            payment_method: 'Cash on Delivery (COD)',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'COD placement failed');

        setVerifiedPaymentId('COD_' + orderCreated.order_id.slice(-6));
        setPaymentSuccess(true);
        setTimeout(() => router.push('/account/orders'), 2000);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsPaying(false);
      }
      return;
    }

    // Razorpay Flow
    try {
      // 1. Create Razorpay Order
      const rzpInitRes = await fetch('/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderCreated.order_id }),
      });

      const rzpData = await rzpInitRes.json();
      if (!rzpInitRes.ok) throw new Error(rzpData.error || 'Failed to initialize Razorpay checkout');

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }

      // 2. Open Razorpay Checkout Dialog
      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'ShopEZ Marketplace',
        description: `Order #${orderCreated.order_id.slice(-8)} Payment`,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        order_id: rzpData.razorpay_order_id,
        prefill: {
          name: address.name,
          contact: address.phone,
          email: 'buyer@shopez.com',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async function (response) {
          // 3. Verify Payment Signature on Backend
          try {
            const verifyRes = await fetch('/api/checkout/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: orderCreated.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                buyer_confirmed: true,
                payment_method_label: 'Razorpay (UPI / Paytm / Cards)',
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setVerifiedPaymentId(response.razorpay_payment_id);
              setPaymentSuccess(true);
              setTimeout(() => {
                router.push('/account/orders');
              }, 2000);
            } else {
              setError(verifyData.error || 'Payment signature verification failed');
            }
          } catch (vErr) {
            setError(vErr.message || 'Payment verification failed');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error('Razorpay payment error:', err);
      setError(err.message || 'Razorpay payment could not be opened');
      setIsPaying(false);
    }
  };

  if (loading || authStatus === 'loading') {
    return (
      <div className="page-container" style={{ padding: '3rem 1rem' }}>
        <h2>Loading checkout...</h2>
      </div>
    );
  }

  // Amazon-style Sign In Required Gate for Checkout
  if (authStatus === 'unauthenticated') {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Lock size={26} color="var(--accent-bright)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign in to place your order</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Please sign in or create an account to securely save your delivery address, pay via Razorpay, and track your package.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/login?callbackUrl=/checkout" className="btn-glow" style={{ textDecoration: 'none', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem' }}>
              Sign in to your account <ArrowRight size={16} />
            </Link>
            <Link href="/signup" className="btn-outline" style={{ textDecoration: 'none', padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
              Create a new ShopEZ account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div className="card fade-in" style={{ maxWidth: '540px', margin: '0 auto', padding: '3rem 2rem', border: '1px solid var(--emerald)' }}>
          <CheckCircle2 size={64} color="var(--emerald)" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Payment Successful!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Paid ₹{orderCreated?.total_amount} via <strong>Razorpay (Payment ID: {verifiedPaymentId})</strong>
          </p>
          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 8, margin: '1.5rem 0', fontSize: '0.85rem' }}>
            Order ID: <strong>{orderCreated?.order_id}</strong>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Redirecting to your live order tracking in 2 seconds...
          </p>
          <button onClick={() => router.push('/account/orders')} className="btn-glow" style={{ padding: '0.75rem 2rem' }}>
            Track Your Package Live
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Official Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="page-container" style={{ padding: '2.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
            <Zap size={15} /> POWERED BY RAZORPAY SECURE GATEWAY
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Amazon-Style Secure Checkout</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Pay securely with Razorpay (Paytm, UPI, GPay, Cards, NetBanking) and track your live GPS delivery.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Left Section: Delivery Address + Razorpay Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Delivery Address */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={18} color="var(--accent-bright)" /> 1. Delivery Address
                </h2>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    color: locationSuccess ? 'var(--emerald)' : 'var(--accent-bright)',
                    borderColor: locationSuccess ? 'var(--emerald)' : undefined,
                  }}
                >
                  <Navigation size={14} className={locating ? 'spin' : ''} />
                  {locating ? 'Detecting GPS Location...' : locationSuccess ? '✓ Live Address Detected!' : '📍 Use Current Live Location'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input className="input-field" placeholder="Full Name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number *</label>
                  <input className="input-field" placeholder="10-digit mobile number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Street Address & Flat / House No. *</label>
                  <input className="input-field" placeholder="Flat, House no., Building, Street" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>City / Town *</label>
                  <input className="input-field" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>State *</label>
                  <input className="input-field" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PIN Code *</label>
                  <input className="input-field" placeholder="6-digit PIN code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} style={{ marginTop: '0.25rem' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Country</label>
                  <input className="input-field" value={address.country} disabled style={{ marginTop: '0.25rem', opacity: 0.7 }} />
                </div>
              </div>
            </div>

            {/* 2. Select Payment Method (Razorpay & COD) */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={18} color="var(--accent-bright)" /> 2. Select Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Option A: Razorpay Secure Gateway */}
                <div
                  onClick={() => setPaymentMethod('Razorpay')}
                  style={{
                    border: `1.5px solid ${paymentMethod === 'Razorpay' ? 'var(--accent)' : 'var(--border)'}`,
                    background: paymentMethod === 'Razorpay' ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="radio" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Razorpay Secure Payment</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          UPI (Paytm, Google Pay, PhonePe), Cards (Visa, MasterCard, RuPay), NetBanking, & Wallets
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-published">RECOMMENDED</span>
                  </div>
                </div>

                {/* Option B: Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  style={{
                    border: `1.5px solid ${paymentMethod === 'COD' ? 'var(--accent)' : 'var(--border)'}`,
                    background: paymentMethod === 'COD' ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius)',
                    padding: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cash on Delivery (COD)</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Pay with Cash or UPI upon parcel arrival
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Review & Explicit Confirmation Gate (BRD BR-08) */}
            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--accent)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={18} color="var(--accent-bright)" /> 3. Review & Confirm Order
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Per platform safety guardrails (BRD BR-08), you must explicitly review and confirm the order total before any charge occurs.
              </p>

              {!orderCreated ? (
                <button onClick={handleReviewOrder} className="btn-outline" style={{ width: '100%', padding: '0.875rem' }}>
                  Review Final Order Details
                </button>
              ) : (
                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span>Order ID: <strong>{orderCreated.order_id}</strong></span>
                    <span>Gateway: <strong>{paymentMethod === 'Razorpay' ? 'Razorpay Secure' : 'COD'}</strong></span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--emerald)', marginBottom: '1rem' }}>
                    Total to Pay: ₹{orderCreated.total_amount}
                  </div>

                  <button
                    onClick={handleRazorpayPayment}
                    disabled={isPaying}
                    className="btn-glow"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.95rem',
                    }}
                  >
                    <CreditCard size={18} />
                    {isPaying
                      ? 'Opening Razorpay Gateway...'
                      : paymentMethod === 'Razorpay'
                      ? `Pay ₹${orderCreated.total_amount} with Razorpay`
                      : `Confirm COD Order of ₹${orderCreated.total_amount}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Order Summary & Agent Assistant */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary ({cart?.items?.length || 0} items)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                {cart?.items?.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{item.title} (x{item.qty})</span>
                    <span style={{ fontWeight: 700 }}>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-bright)' }}>₹{total}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
