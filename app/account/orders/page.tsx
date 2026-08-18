'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShieldCheck,
  FileText,
  RotateCcw,
  Star,
  Smartphone,
  CreditCard,
  MapPin,
  LogIn,
  Lock,
  X,
  Navigation,
  Phone,
  Radio,
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);

  useEffect(() => {
    async function loadOrders() {
      if (authStatus === 'unauthenticated') {
        setLoading(false);
        return;
      }
      if (authStatus === 'authenticated') {
        try {
          const res = await fetch('/api/account/orders');
          if (res.ok) {
            const data = await res.json();
            setOrders(data.orders || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    }
    loadOrders();
  }, [authStatus]);

  // If user is not signed in
  if (authStatus === 'unauthenticated') {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card fade-in" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Lock size={26} color="var(--accent-bright)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sign in to see your orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Track deliveries, view past purchases, and download official payment invoices by signing into your account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/login" className="btn-glow" style={{ textDecoration: 'none', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem' }}>
              <LogIn size={16} /> Sign in to your account
            </Link>
            <Link href="/signup" className="btn-outline" style={{ textDecoration: 'none', padding: '12px', textAlign: 'center', fontSize: '0.9rem' }}>
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '3rem 1rem', minHeight: '90vh' }}>
      {/* Amazon Header Style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Your Orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Track deliveries with live GPS, manage purchases, and view payment receipts.
          </p>
        </div>
        <Link href="/search" className="btn-outline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.4 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>No orders placed yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem', maxWidth: 400, margin: '0.5rem auto 2rem' }}>
            Looking for something? Explore thousands of top-rated items in our marketplace.
          </p>
          <Link href="/search" className="btn-glow" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px' }}>
            Browse Storefront <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => {
            const isPaid = order.status === 'paid' || order.status === 'delivered';
            const deliveryDate = order.estimatedDeliveryDate
              ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })
              : 'Thursday, 3 Business Days';

            return (
              <div
                key={order._id}
                className="card fade-in"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                {/* Amazon-style Order Meta Header */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Order Placed</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Total</div>
                      <div style={{ color: 'var(--accent-bright)', fontWeight: 800, marginTop: 2, fontSize: '0.95rem' }}>
                        ₹{order.totalAmount ? order.totalAmount.toLocaleString('en-IN') : 0}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Ship To</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--accent-bright)" />
                        {order.shippingAddress?.name || 'Customer'}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Payment Method</div>
                      <div style={{ color: 'var(--emerald)', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Smartphone size={13} /> {order.paymentMethod || 'Paytm / UPI'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600 }}>Order # {order._id ? order._id.slice(-8) : ''}</div>
                    <button
                      onClick={() => alert(`ShopEZ Tax Invoice\nOrder ID: ${order._id}\nTotal Paid: ₹${order.totalAmount}\nPayment Method: ${order.paymentMethod || 'Paytm / UPI'}\nStatus: Verified & Confirmed`)}
                      className="btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--accent-bright)', marginTop: 2 }}
                    >
                      <FileText size={12} /> View Invoice
                    </button>
                  </div>
                </div>

                {/* Body: Delivery Status & Product Listing */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Delivery Estimate Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: isPaid ? 'var(--emerald)' : 'var(--gold)' }}>
                        {isPaid ? `Arriving ${deliveryDate}` : 'Payment Pending'}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Package is moving along the live fulfillment route.
                      </p>
                    </div>

                    <span className={`badge badge-${isPaid ? 'published' : 'draft'}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                      {order.status ? order.status.toUpperCase() : 'CONFIRMED'}
                    </span>
                  </div>

                  {/* Amazon Delivery Progress Tracker */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', fontSize: '0.75rem', position: 'relative' }}>
                      <div style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--emerald)', margin: '0 auto 6px' }} />
                        Ordered
                      </div>
                      <div style={{ color: isPaid ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: isPaid ? 'var(--emerald)' : 'var(--border)', margin: '0 auto 6px' }} />
                        Shipped
                      </div>
                      <div style={{ color: isPaid ? 'var(--emerald)' : 'var(--text-muted)', fontWeight: 600 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: isPaid ? 'var(--emerald)' : 'var(--border)', margin: '0 auto 6px' }} />
                        Out for Delivery
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--border)', margin: '0 auto 6px' }} />
                        Delivered
                      </div>
                    </div>
                  </div>

                  {/* Product Rows & Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {order.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                          paddingTop: idx > 0 ? '1.25rem' : 0,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                            />
                          ) : (
                            <div style={{ width: 72, height: 72, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={28} color="var(--text-muted)" />
                            </div>
                          )}

                          <div>
                            <Link href={`/product/${item.productId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                              {item.title}
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              Quantity: {item.qty} • ₹{item.price ? item.price.toLocaleString('en-IN') : 0} each
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', marginTop: 2, fontWeight: 600 }}>
                              ✓ Eligible for Free Return within 7 days
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Link
                            href={`/product/${item.productId}`}
                            className="btn-glow"
                            style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <RotateCcw size={13} /> Buy it again
                          </Link>

                          {/* Open Live GPS Location Tracker Modal */}
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="btn-outline"
                            style={{
                              fontSize: '0.8rem',
                              padding: '6px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: 'var(--emerald)',
                              borderColor: 'var(--emerald)',
                            }}
                          >
                            <Navigation size={13} /> 📍 Track Live Location
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live GPS Delivery Map & Route Tracker Modal */}
      {trackingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card fade-in"
            style={{
              maxWidth: '680px',
              width: '100%',
              background: '#0d1117',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              padding: '0',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--emerald)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <Radio size={14} className="spin" /> LIVE GPS SATELLITE TRACKER
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 2 }}>
                  Tracking Order #{trackingOrder._id?.slice(-8)}
                </h2>
              </div>
              <button onClick={() => setTrackingOrder(null)} className="btn-ghost" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Simulated Live GPS Map Visual Canvas */}
            <div
              style={{
                height: '240px',
                background: 'radial-gradient(circle at 50% 50%, #1e293b, #0f172a)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              {/* Map Grid Lines */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

              {/* Transit Path Polyline */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d="M 80 180 Q 240 60 560 120" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="6 6" />
              </svg>

              {/* Waypoint 1: Fulfillment Hub */}
              <div style={{ position: 'absolute', left: 60, top: 160, textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Package size={16} color="#fff" />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>Central Hub</div>
              </div>

              {/* Waypoint 2: Moving Courier Van Beacon */}
              <div style={{ position: 'absolute', left: 280, top: 80, textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '2px solid var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 20px rgba(16,185,129,0.6)' }}>
                  <Truck size={22} color="var(--emerald)" />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald)', marginTop: 4 }}>
                  Courier Van (1.4 km away)
                </div>
              </div>

              {/* Waypoint 3: Buyer Delivery Destination */}
              <div style={{ position: 'absolute', right: 60, top: 100, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <MapPin size={18} color="#000" />
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                  {trackingOrder.shippingAddress?.city || 'Your Address'}
                </div>
              </div>
            </div>

            {/* Driver & Delivery Information */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={22} color="var(--accent-bright)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rajesh Kumar (ShopEZ Express)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicle: Electric Van • KA 01 EQ 4421</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery OTP:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald)', letterSpacing: 2 }}>4829</div>
                </div>
              </div>

              {/* Delivery Address Target */}
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Delivering to:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {trackingOrder.shippingAddress?.name} — {trackingOrder.shippingAddress?.line1}, {trackingOrder.shippingAddress?.city}, {trackingOrder.shippingAddress?.state} - {trackingOrder.shippingAddress?.postalCode}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => alert('Calling Delivery Executive: +91 98765 43210')}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Phone size={15} /> Call Delivery Executive
                </button>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="btn-glow"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
