'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Zap,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  User,
  Package,
  CheckCircle2,
  Lock,
  MapPin,
  Clock,
  Heart,
  Share2,
} from 'lucide-react';
import AgentChat from '@/components/AgentChat';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (addingToCart || cartSuccess) return;
    setAddingToCart(true);

    try {
      const res = await fetch('/api/mcp/orders/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, qty }),
      });

      if (res.ok) {
        setCartSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['cartCount'] });
        setTimeout(() => setCartSuccess(false), 2500);
      }
    } catch (e) {
      console.error('Error adding to cart:', e);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (submittingReview) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setProduct((prev) => ({
        ...prev,
        rating: data.rating,
        numReviews: data.numReviews,
        reviews: data.reviews,
      }));

      setReviewSuccessMsg('🎉 Review submitted successfully! Thank you for your feedback.');
      setReviewComment('');
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccessMsg('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
      </div>
    );
  }

  const mrp = Math.round(product.price * 1.38);
  const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);
  const rating = product.rating || 0;
  const numReviews = product.numReviews || (product.reviews ? product.reviews.length : 0);

  return (
    <div className="page-container" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card"
            style={{
              padding: '1rem',
              overflow: 'hidden',
              position: 'relative',
              height: '460px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                style={{ objectFit: 'contain', padding: '1rem' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={64} color="var(--text-muted)" />
              </div>
            )}
            <button
              onClick={() => alert('Saved to your Wishlist!')}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: 'none',
                borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Heart size={18} color="#fff" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', fontWeight: 600, textTransform: 'uppercase' }}>
              Brand: {product.sellerId?.name || 'ShopEZ Verified Merchant'}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.3, marginTop: 4 }}>
              {product.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    color={rating > 0 && s <= Math.round(rating) ? '#f59e0b' : 'var(--border)'}
                    fill={rating > 0 && s <= Math.round(rating) ? '#f59e0b' : 'none'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: rating > 0 ? 'var(--accent-bright)' : 'var(--text-muted)', fontWeight: 600 }}>
                {rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                | {numReviews > 0 ? `${numReviews} customer review(s)` : 'Be the first to review after delivery!'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700 }}>-{discountPercent}%</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span style={{ fontSize: '1.1rem', verticalAlign: 'super', marginRight: 2 }}>₹</span>
                {product.price ? product.price.toLocaleString('en-IN') : 0}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
              M.R.P.: <span style={{ textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600, marginTop: 4 }}>
              Inclusive of all taxes • FREE Delivery Available
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>About this item</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
              {product.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)' }}>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <Truck size={20} color="var(--accent-bright)" style={{ margin: '0 auto 4px' }} />
              <div>Free Delivery</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <RotateCcw size={20} color="var(--accent-bright)" style={{ margin: '0 auto 4px' }} />
              <div>7-Day Returns</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={20} color="var(--accent-bright)" style={{ margin: '0 auto 4px' }} />
              <div>Secure Payment</div>
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.5rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-secondary)',
          }}
        >
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{product.price ? product.price.toLocaleString('en-IN') : 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 600, marginTop: 4 }}>
              FREE delivery available
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={13} color="var(--text-muted)" /> Deliver to Your Location
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: (product.stock ?? 1) > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
            {(product.stock ?? 1) > 0 ? `In Stock (${product.stock ?? 10} available)` : 'Currently Out of Stock'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quantity:</span>
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="input-field"
              style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem' }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button
              id={`detail-add-to-cart-${productId}`}
              onClick={handleAddToCart}
              disabled={addingToCart}
              style={{
                background: cartSuccess ? 'var(--emerald)' : '#ffd814',
                color: cartSuccess ? '#fff' : '#0f1111',
                border: '1px solid #fcd200',
                borderRadius: 999,
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <ShoppingCart size={16} />
              {cartSuccess ? '✓ Added to Cart!' : addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              style={{
                background: '#ffa41c',
                color: '#0f1111',
                border: '1px solid #ff8f00',
                borderRadius: 999,
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Zap size={16} fill="#0f1111" />
              Buy Now
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center', marginTop: 4 }}>
            <Lock size={12} /> Secure transaction
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" /> Customer Ratings & Reviews
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 3 }}>
              {rating > 0
                ? `Overall score: ${rating.toFixed(1)} / 5.0 across ${numReviews} verified customer reviews`
                : 'No reviews submitted yet. Delivered buyers can share their feedback here.'}
            </p>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="btn-glow"
            style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Star size={15} /> Write a Customer Review
          </button>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {product.reviews.map((rev, rIdx) => (
              <div
                key={rev._id || rIdx}
                className="card"
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                      {rev.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rev.userName}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 999 }}>
                    ✓ Verified Buyer
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      color={s <= rev.rating ? '#f59e0b' : 'var(--border)'}
                      fill={s <= rev.rating ? '#f59e0b' : 'none'}
                    />
                  ))}
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, marginLeft: 4 }}>{rev.rating}.0 / 5.0</span>
                </div>

                {rev.comment && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>
                    "{rev.comment}"
                  </p>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 6 }}>
                  Reviewed on {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Star size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>No Customer Reviews Yet</div>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '6px auto 1rem' }}>
              Purchased this item? Leave your star rating and feedback after delivery to help other shoppers!
            </p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-outline"
              style={{ fontSize: '0.85rem', padding: '6px 16px' }}
            >
              Be the first to review
            </button>
          </div>
        )}
      </div>

      {showReviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
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
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Rate & Review Product</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Share your experience with <strong>{product.title}</strong>:
            </p>

            {reviewSuccessMsg ? (
              <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid var(--emerald)', borderRadius: 'var(--radius)', color: 'var(--emerald)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>
                {reviewSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Your Star Rating:
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <Star
                          size={28}
                          color={s <= reviewRating ? '#f59e0b' : 'var(--border)'}
                          fill={s <= reviewRating ? '#f59e0b' : 'none'}
                        />
                      </button>
                    ))}
                    <span style={{ marginLeft: 8, fontWeight: 700, fontSize: '0.95rem', color: '#f59e0b' }}>
                      {reviewRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Write your review (optional):
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other shoppers what you loved about this product, quality, fit, or performance..."
                    className="input-field"
                    style={{ width: '100%', resize: 'vertical', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn-ghost"
                    style={{ padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-glow"
                    style={{ padding: '8px 20px', fontWeight: 700 }}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={18} color="var(--accent-bright)" /> Ask AI Shopping Assistant about this product
        </h2>
        <div style={{ maxWidth: '600px' }}>
          <AgentChat role="buyer" productId={productId} />
        </div>
      </div>
    </div>
  );
}
