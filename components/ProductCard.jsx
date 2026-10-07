'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Package, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductCard({
  product,
  onAddToCart,
  showAddToCart = true,
  compact = false,
}) {
  const queryClient = useQueryClient();
  const id = product._id || product.objectID || '';
  const inStock = (product.stock ?? 1) > 0;
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const rating = product.rating || 0;
  const numReviews = product.numReviews || 0;

  const handleDefaultAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToCart) {
      onAddToCart(id);
      return;
    }

    if (adding || added) return;
    setAdding(true);

    try {
      const res = await fetch('/api/mcp/orders/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, qty: 1 }),
      });

      if (res.ok) {
        setAdded(true);
        queryClient.invalidateQueries({ queryKey: ['cartCount'] });
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card-product fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <Link
        href={`/product/${id}`}
        style={{
          textDecoration: 'none',
          display: 'block',
          position: 'relative',
          paddingTop: compact ? '70%' : '80%',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={(e) => ((e.currentTarget).style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => ((e.currentTarget).style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={40} color="var(--text-muted)" />
          </div>
        )}
        {!inStock && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="badge badge-delisted">Out of Stock</span>
          </div>
        )}
        {product.category && (
          <span style={{ position: 'absolute', top: 10, left: 10 }} className="badge badge-new">
            {product.category}
          </span>
        )}
      </Link>

      {/* Info */}
      <div style={{ padding: compact ? '12px' : '16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link href={`/product/${id}`} style={{ textDecoration: 'none' }}>
          <h3
            style={{
              color: 'var(--text-primary)',
              fontSize: compact ? '0.85rem' : '0.95rem',
              fontWeight: 600,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.title}
          </h3>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={11}
              color={rating > 0 && s <= Math.round(rating) ? '#f59e0b' : 'var(--border)'}
              fill={rating > 0 && s <= Math.round(rating) ? '#f59e0b' : 'none'}
            />
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 2 }}>
            {rating > 0 ? `(${rating.toFixed(1)})` : '(0)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
          <div>
            <span style={{ fontSize: compact ? '1rem' : '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ₹{product.price ? product.price.toLocaleString('en-IN') : 0}
            </span>
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 1 }}>Only {product.stock} left</div>
            )}
          </div>

          {showAddToCart && inStock && (
            <button
              id={`add-to-cart-${id}`}
              className={added ? 'btn-outline' : 'btn-glow'}
              onClick={handleDefaultAddToCart}
              disabled={adding}
              style={{
                padding: '7px 14px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderColor: added ? 'var(--emerald)' : undefined,
                color: added ? 'var(--emerald)' : undefined,
              }}
            >
              {added ? (
                <>
                  <Check size={14} color="var(--emerald)" /> Added
                </>
              ) : (
                <>
                  <ShoppingCart size={13} /> {adding ? '...' : '+ Add'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
