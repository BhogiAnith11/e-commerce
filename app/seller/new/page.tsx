'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import AgentChat from '@/components/AgentChat';

const POPULAR_CATEGORIES = ['Shoes', 'Sports', 'Innerwear', 'Electronics', 'Clothing', 'Footwear', 'Books', 'Home', 'Beauty', 'Watches'];

export default function NewListingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sellerHints, setSellerHints] = useState('');

  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [moderationPassed, setModerationPassed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFileBase64(result.split(',')[1]);
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };


  // Generate Draft with Claude AI / Image
  const handleGenerateDraft = async () => {
    setError('');
    setLoadingDraft(true);

    try {
      const payload: any = { seller_hints: sellerHints };
      if (tab === 'upload') {
        if (!fileBase64) throw new Error('Please select an image file');
        payload.image_base64 = fileBase64;
      } else {
        if (!imageUrlInput) throw new Error('Please enter a product or image URL');
        payload.url = imageUrlInput;
      }

      const res = await fetch('/api/seller/listings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate draft');

      setDraft(data);
      if (data.image_url && !previewUrl) {
        setPreviewUrl(data.image_url);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDraft(false);
    }
  };

  // Explicit Human-in-the-Loop Confirmation & Publish Gate (BRD BR-04)
  const handleConfirmAndPublish = async () => {
    if (!draft?.draft_id) return;
    setPublishing(true);
    setError('');

    try {
      const res = await fetch(`/api/seller/listings/${draft.draft_id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_confirmed: true, // EXPLICIT SELLER CONFIRMATION GATE
          final_price: draft.suggested_price,
          title: draft.title,
          description: draft.description,
          category: draft.category || 'General',
          tags: draft.tags || [],
          image_url: draft.image_url,
          media_id: draft.media_id,
          stock: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');

      router.push('/seller/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '3rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>List a Product with AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Upload a product photo or paste a URL to generate an AI-powered listing in seconds.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left: Input & Draft Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!draft ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setTab('upload')}
                  className={tab === 'upload' ? 'btn-glow' : 'btn-ghost'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={16} /> Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setTab('url')}
                  className={tab === 'url' ? 'btn-glow' : 'btn-ghost'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LinkIcon size={16} /> Product URL
                </button>
              </div>

              {tab === 'upload' ? (
                <div>
                  <label style={{ display: 'block', border: '2px dashed var(--border-bright)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ maxHeight: 180, margin: '0 auto', borderRadius: 8 }} />
                    ) : (
                      <>
                        <Upload size={36} color="var(--accent-bright)" style={{ margin: '0 auto 0.75rem' }} />
                        <div style={{ fontWeight: 600 }}>Click to select an image file</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG or WebP up to 10MB</div>
                      </>
                    )}
                  </label>

                  <button
                    onClick={handleGenerateDraft}
                    disabled={loadingDraft}
                    className="btn-glow"
                    style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Sparkles size={18} />
                    {loadingDraft ? 'Analyzing image & generating draft...' : 'Generate AI Listing Draft'}
                  </button>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Paste product webpage or image URL</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://example.com/product/123 or image link"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                  />

                  <button
                    onClick={handleGenerateDraft}
                    disabled={loadingDraft}
                    className="btn-glow"
                    style={{ width: '100%', padding: '0.875rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Sparkles size={18} />
                    {loadingDraft ? 'Generating draft from URL...' : 'Generate AI Listing Draft'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Human-in-the-Loop Review Form */
            <div className="card fade-in" style={{ padding: '1.5rem', border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Review & Edit Listing Draft</h2>
                <button onClick={() => { setDraft(null); }} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Start over</button>
              </div>


              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Title</label>
                  <input
                    className="input-field"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    style={{ marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    style={{ marginTop: '0.25rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Category (e.g. Shoes, Sports, Innerwear)
                    </label>
                    <input
                      className="input-field"
                      placeholder="Enter any category"
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      style={{ marginTop: '0.25rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Price (INR ₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={draft.suggested_price}
                      onChange={(e) => setDraft({ ...draft, suggested_price: Number(e.target.value) })}
                      style={{ marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

                {/* Category quick selectors for draft */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Or select category:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {POPULAR_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDraft({ ...draft, category: cat })}
                        style={{
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: `1px solid ${draft.category === cat ? 'var(--accent)' : 'var(--border)'}`,
                          background: draft.category === cat ? 'var(--accent-glow)' : 'transparent',
                          color: draft.category === cat ? 'var(--accent-bright)' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmAndPublish}
                  disabled={publishing}
                  className="btn-glow"
                  style={{ width: '100%', padding: '0.875rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={18} />
                  {publishing ? 'Publishing live to ShopEZ...' : `Explicitly Approve & Publish in "${draft.category || 'General'}"`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Seller AI Agent Chat Companion */}
        <div>
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
  );
}
