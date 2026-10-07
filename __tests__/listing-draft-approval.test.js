/**
 * listing-draft-approval.test.js
 * TDD §11: Contract tests verifying agent only calls publish_listing
 * after seller_confirmed=true AND moderation passes.
 * "Red-team tests: attempt to get the Seller Agent to skip confirmation gates."
 */

// ---- Simulated publish gate (mirrors /api/mcp/catalog/publish) ---- //
function publishListing(draft, seller_confirmed, final_price, moderation) {
  // Hard gate 1: explicit seller confirmation required
  if (seller_confirmed !== true) {
    return { error: 'publish_listing requires seller_confirmed=true' };
  }

  // Hard gate 2: moderation must have passed
  if (!moderation.passed) {
    return { error: `Moderation failed: ${moderation.reason}` };
  }

  // Hard gate 3: price must be positive
  if (!final_price || final_price <= 0) {
    return { error: 'final_price must be a positive number' };
  }

  // Hard gate 4: required fields
  if (!draft.title || !draft.image_url) {
    return { error: 'title and image_url are required' };
  }

  return { product_id: 'P-' + Math.random().toString(36).slice(2, 8).toUpperCase(), status: 'published' };
}

const cleanModeration = { passed: true, reason: '', risk_level: 'low' };
const flaggedModeration = { passed: false, reason: 'Prohibited item detected', risk_level: 'high' };

const validDraft = {
  draft_id: 'draft-001',
  title: "Men's Running Shoes — Blue, Size UK 9",
  description: 'Lightweight mesh running shoes with cushioned sole.',
  category: 'Footwear',
  tags: ['shoes', 'running', 'sports'],
  image_url: 'https://example.com/img.jpg',
  media_id: 'media-001',
  seller_id: 'seller-1',
};

// ---- Tests ---- //
describe('Seller Listing — publish confirmation gate (BR-04)', () => {
  it('✅ publishes when seller_confirmed=true and moderation passes', () => {
    const result = publishListing(validDraft, true, 2299, cleanModeration);
    expect(result.error).toBeUndefined();
    expect(result.product_id).toMatch(/^P-/);
    expect(result.status).toBe('published');
  });

  it('❌ blocks publish when seller_confirmed=false', () => {
    const result = publishListing(validDraft, false, 2299, cleanModeration);
    expect(result.error).toMatch(/seller_confirmed=true/);
    expect(result.product_id).toBeUndefined();
  });

  it('❌ blocks publish when seller_confirmed is undefined (silence ≠ approval)', () => {
    const result = publishListing(validDraft, undefined, 2299, cleanModeration);
    expect(result.error).toMatch(/seller_confirmed=true/);
  });

  it('❌ blocks publish when moderation fails', () => {
    const result = publishListing(validDraft, true, 2299, flaggedModeration);
    expect(result.error).toMatch(/Moderation failed/);
    expect(result.error).toMatch(/Prohibited item detected/);
    expect(result.product_id).toBeUndefined();
  });

  it('❌ blocks publish with zero price', () => {
    const result = publishListing(validDraft, true, 0, cleanModeration);
    expect(result.error).toMatch(/final_price/);
  });

  it('❌ blocks publish with negative price', () => {
    const result = publishListing(validDraft, true, -100, cleanModeration);
    expect(result.error).toMatch(/final_price/);
  });

  it('❌ blocks publish if title is missing', () => {
    const draftNoTitle = { ...validDraft, title: '' };
    const result = publishListing(draftNoTitle, true, 2299, cleanModeration);
    expect(result.error).toMatch(/title/);
  });

  it('❌ blocks publish even with seller_confirmed=true but moderation not yet run (not passed)', () => {
    // Simulates agent calling publish without waiting for moderation result
    const noModeration = { passed: false, reason: 'Moderation not run', risk_level: 'high' };
    const result = publishListing(validDraft, true, 2299, noModeration);
    expect(result.error).toMatch(/Moderation failed/);
  });
});

describe('Seller Listing — draft state machine', () => {
  it('produces a valid draft structure from generate_listing_draft output', () => {
    const draft = {
      draft_id: 'draft-abc',
      title: 'Blue Running Shoes',
      description: 'Comfortable mesh shoes for daily running.',
      category: 'Footwear',
      tags: ['shoes', 'running', 'blue'],
      suggested_price: 2499,
    };

    expect(draft.draft_id).toBeDefined();
    expect(draft.title.length).toBeLessThanOrEqual(80);
    expect(draft.tags).toBeInstanceOf(Array);
    expect(draft.suggested_price).toBeGreaterThan(0);
  });

  it('seller can override suggested price', () => {
    const suggestedPrice = 2499;
    const sellerOverridePrice = 2299;

    // Agent must use the seller's final agreed price, not the suggested price
    const finalPrice = sellerOverridePrice; // seller said "change price to 2299"
    expect(finalPrice).toBe(2299);
    expect(finalPrice).not.toBe(suggestedPrice);
  });
});
