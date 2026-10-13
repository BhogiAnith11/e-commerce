'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Package,
  IndianRupee,
  Layers,
  FileText,
  X,
  Eye,
  Store,
  RefreshCw,
  Plus
} from 'lucide-react';
import AgentChat from '@/components/AgentChat';

const POPULAR_CATEGORIES = [
  'Shoes',
  'Electronics',
  'Clothing',
  'Watches',
  'Sports',
  'Home',
  'Beauty',
  'Footwear',
  'Books',
  'Accessories'
];

export default function NewListingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Tab: 'upload' | 'url'
  const [tab, setTab] = useState('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [fileBase64, setFileBase64] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState('');

  // Product Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Shoes');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('15');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('trending, bestseller');
  const [draftId, setDraftId] = useState(null);
  const [mediaId, setMediaId] = useState(null);

  // Status & Feedback States
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiNotice, setAiNotice] = useState('');
  const [error, setError] = useState('');

  // Handle File Upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be less than 10MB');
        return;
      }
      setFileName(file.name);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setFileBase64(result.split(',')[1]);
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove / Reset Image
  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setFileBase64(null);
    setFileName('');
    setImageUrlInput('');
  };

  // URL input handler
  const handleUrlApply = () => {
    if (!imageUrlInput.trim()) {
      setError('Please paste a valid image URL');
      return;
    }
    setPreviewUrl(imageUrlInput.trim());
    setFileBase64(null);
    setFileName('Remote Image URL');
    setError('');
  };

  // AI Auto-Fill Functionality
  const handleAutoFillAI = async () => {
    setError('');
    setAiNotice('');

    const hasImage = fileBase64 || previewUrl || imageUrlInput;
    if (!hasImage) {
      setError('Please select an image photo or provide a URL first so AI can analyze it.');
      return;
    }

    setLoadingDraft(true);
    try {
      const payload = { seller_hints: title || '' };
      if (fileBase64) {
        payload.image_base64 = fileBase64;
      } else if (previewUrl || imageUrlInput) {
        payload.url = previewUrl || imageUrlInput;
      }

      const res = await fetch('/api/seller/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze product image with AI');

      // Auto-fill all seller fields with AI results
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.category) setCategory(data.category);
      if (data.suggested_price || data.price) {
        setPrice(String(data.suggested_price || data.price));
        setMrp(String(Math.round((data.suggested_price || data.price) * 1.25)));
      }
      if (data.tags) {
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags));
      }
      if (data.draft_id) setDraftId(data.draft_id);
      if (data.media_id) setMediaId(data.media_id);
      if (data.image_url && !previewUrl) {
        setPreviewUrl(data.image_url);
      }

      setAiNotice('✨ AI has auto-filled product details from your photo! You can edit any field before publishing.');
    } catch (e) {
      console.warn('AI Generation Notice:', e.message);
      setError(`AI analysis note: ${e.message}. You can still fill in the details manually below.`);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Publish Product Directly (Standard E-Commerce Seller Action)
  const handlePublishProduct = async (status = 'published') => {
    setError('');

    // Validations
    if (!title.trim()) {
      setError('Please enter a Product Title.');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid Selling Price in INR (₹).');
      return;
    }
    const finalImage = previewUrl || (imageUrlInput.trim() || null);
    if (!finalImage && !fileBase64) {
      setError('Please upload a product photo or provide an image link.');
      return;
    }

    setPublishing(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || `${title.trim()} - High quality verified product listed on ShopEZ.`,
        category: category.trim() || 'General',
        price: Number(price),
        stock: Number(stock) >= 0 ? Number(stock) : 10,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status,
        draftId: draftId || `manual-${Date.now()}`,
        mediaId: mediaId || undefined,
      };

      if (fileBase64) {
        payload.imageBase64 = fileBase64;
      } else if (finalImage) {
        payload.imageUrl = finalImage;
      }

      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish product');
      }

      // Success -> Redirect to Seller Dashboard
      router.push('/seller/dashboard');
    } catch (e) {
      setError(e.message || 'Error publishing listing. Please check required fields.');
    } finally {
      setPublishing(false);
    }
  };

  const discountPercent =
    price && mrp && Number(mrp) > Number(price)
      ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)
      : null;

  return (
    <div className="page-container" style={{ padding: '2.5rem 1rem', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', color: 'var(--accent-bright)', padding: '4px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Store size={14} /> Merchant Central • New Product Listing
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Add New Product
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: 4 }}>
            Upload your product photo, customize details, or auto-fill with AI to publish directly to the storefront.
          </p>
        </div>

        {/* Quick Action Publish Header Button */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => handlePublishProduct('draft')}
            disabled={publishing}
            className="btn-ghost"
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handlePublishProduct('published')}
            disabled={publishing}
            className="btn-glow"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', padding: '0.6rem 1.5rem', fontWeight: 700 }}
          >
            <CheckCircle2 size={16} />
            {publishing ? 'Publishing...' : 'Publish Product'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(244,63,94,0.12)', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '0.85rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {aiNotice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(99,102,241,0.12)', border: '1px solid var(--accent)', color: 'var(--accent-bright)', padding: '0.85rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* Main Grid: Form on Left (2 cols) & Companion/Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Seller Product Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SECTION 1: Product Photo Upload */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  1
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Product Photo <span style={{ color: 'var(--rose)' }}>*</span>
                </h2>
              </div>

              {/* AI Auto-Fill Button directly accessible at the photo step */}
              <button
                type="button"
                onClick={handleAutoFillAI}
                disabled={loadingDraft || (!fileBase64 && !previewUrl && !imageUrlInput)}
                className="btn-glow"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  opacity: (!fileBase64 && !previewUrl && !imageUrlInput) ? 0.6 : 1,
                  cursor: (!fileBase64 && !previewUrl && !imageUrlInput) ? 'not-allowed' : 'pointer'
                }}
                title="AI reads the photo and fills Title, Category, Price & Description"
              >
                <Sparkles size={14} />
                {loadingDraft ? 'AI Analyzing...' : '✨ Auto-Fill with AI'}
              </button>
            </div>

            {/* Upload Method Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setTab('upload')}
                className={tab === 'upload' ? 'btn-glow' : 'btn-ghost'}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} /> Upload Local Image
              </button>
              <button
                type="button"
                onClick={() => setTab('url')}
                className={tab === 'url' ? 'btn-glow' : 'btn-ghost'}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LinkIcon size={14} /> Paste Image URL
              </button>
            </div>

            {previewUrl ? (
              /* Image Preview Box with Replace/Remove options */
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-bright)' }}>
                <div style={{ width: 110, height: 110, borderRadius: 8, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <img src={previewUrl} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> Photo Loaded & Ready
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {fileName || 'Product primary photo'}
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 6, background: 'var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={12} /> Replace Photo
                      <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 6, background: 'rgba(244,63,94,0.15)', color: 'var(--rose)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : tab === 'upload' ? (
              /* File Drag & Drop Target */
              <label style={{ display: 'block', border: '2px dashed var(--border-bright)', borderRadius: 'var(--radius)', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', transition: 'all 0.2s ease' }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--accent-bright)' }}>
                  <Upload size={24} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Click to select product photo or drag & drop
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  PNG, JPG or WebP up to 10MB • Recommended square 800x800px
                </div>
              </label>
            ) : (
              /* Image URL Input */
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/product-image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleUrlApply}
                  className="btn-glow"
                  style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                >
                  Load Image
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: General Details (Title & Category) */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                2
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Product Details
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Product Title */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <span>Product Title / Name <span style={{ color: 'var(--rose)' }}>*</span></span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{title.length}/120 characters</span>
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Nike Air Max Running Shoes - Triple Black"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              {/* Category Input + Quick Selection Chips */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Category <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="Enter or select category (e.g. Shoes, Electronics)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ marginBottom: '0.6rem' }}
                  required
                />
                
                {/* Popular Category Chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 2 }}>Quick select:</span>
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: 999,
                        border: `1px solid ${category.toLowerCase() === cat.toLowerCase() ? 'var(--accent)' : 'var(--border)'}`,
                        background: category.toLowerCase() === cat.toLowerCase() ? 'var(--accent-glow)' : 'transparent',
                        color: category.toLowerCase() === cat.toLowerCase() ? 'var(--accent-bright)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing & Inventory */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                3
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pricing & Inventory
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {/* Selling Price */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Selling Price (₹) <span style={{ color: 'var(--rose)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="1999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{ paddingLeft: '1.8rem' }}
                    required
                  />
                </div>
              </div>

              {/* MRP / Original Price */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <span>MRP (Original ₹)</span>
                  {discountPercent && discountPercent > 0 && (
                    <span style={{ color: 'var(--emerald)', fontSize: '0.75rem', fontWeight: 700 }}>
                      {discountPercent}% OFF
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="2499"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    style={{ paddingLeft: '1.8rem' }}
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Stock Quantity (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="15"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Description & Search Tags */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--accent-glow)', color: 'var(--accent-bright)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                4
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Description & SEO Tags
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Product Description
                </label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Describe key features, materials, sizing, dimensions, and instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Search Keywords / Tags */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  <span>Search Tags (comma-separated)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Helps buyers find your product</span>
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. sneakers, running, athletic, leather, lightweight"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={() => router.push('/seller/dashboard')}
              className="btn-ghost"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handlePublishProduct('draft')}
              disabled={publishing}
              className="btn-ghost"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handlePublishProduct('published')}
              disabled={publishing}
              className="btn-glow"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={18} />
              {publishing ? 'Publishing Live...' : 'Publish Product to Storefront'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Card Preview & Seller AI Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '5rem' }}>
          
          {/* Realtime Storefront Card Preview */}
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <Eye size={15} /> Storefront Live Preview
              </div>
              <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                Live Mockup
              </span>
            </div>

            {/* Mock Card */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: '100%', height: 180, background: '#0a0f1d', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>
                    <Upload size={28} style={{ margin: '0 auto 4px', opacity: 0.5 }} />
                    No image uploaded yet
                  </div>
                )}
                {category && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', color: 'var(--accent-bright)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, fontWeight: 700, border: '1px solid var(--border)' }}>
                    {category}
                  </span>
                )}
              </div>

              <div style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.3, minHeight: '2.6em', textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {title || 'Your Product Title Will Appear Here'}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-bright)' }}>
                    ₹{price ? Number(price).toLocaleString('en-IN') : '0'}
                  </span>
                  {mrp && Number(mrp) > Number(price) && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ₹{Number(mrp).toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent && discountPercent > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700 }}>
                      ({discountPercent}% off)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Stock: {stock ? `${stock} units` : '10 units'}</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>● In Stock</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller AI Assistant Companion */}
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <AgentChat
              role="seller"
              onActionComplete={(action, data) => {
                if (action === 'publish_listing' && data.product_id) {
                  router.push('/seller/dashboard');
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
