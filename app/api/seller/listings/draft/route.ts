import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/seller/listings/draft
 * BFF wrapper: ingest image/URL + analyze + generate_draft in one call.
 * Used by the manual listing form (non-AI path).
 *
 * Body:
 *   { image_base64?, content_type?, url?, seller_hints? }
 *
 * Returns:
 *   { draft_id, media_id, image_url, title, description, category, tags, suggested_price }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id?: string }).id!;
    const body = await req.json();
    const { image_base64, content_type = 'image/jpeg', url, seller_hints } = body;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const cookieHeader = req.headers.get('cookie') || '';

    const headers = { 'Content-Type': 'application/json', Cookie: cookieHeader };

    let ingestResult: Record<string, unknown>;

    // Step 1: Ingest
    if (image_base64) {
      const res = await fetch(`${baseUrl}/api/mcp/media/ingest-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_base64, seller_id: userId, content_type }),
      });
      ingestResult = await res.json();
    } else if (url) {
      const res = await fetch(`${baseUrl}/api/mcp/media/ingest-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, seller_id: userId }),
      });
      ingestResult = await res.json();
      if ((ingestResult as { error?: string }).error) {
        return NextResponse.json(ingestResult, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Either image_base64 or url is required' }, { status: 400 });
    }

    if ((ingestResult as { error?: string }).error) {
      return NextResponse.json(ingestResult, { status: 400 });
    }

    const { media_id, image_url, extracted_title, extracted_price } = ingestResult as {
      media_id: string; image_url: string; extracted_title?: string; extracted_price?: number;
    };

    // Step 2: Analyze
    const analyzeRes = await fetch(`${baseUrl}/api/mcp/media/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_url, media_id }),
    });
    const analysis = await analyzeRes.json();

    // Step 3: Generate draft
    const draftRes = await fetch(`${baseUrl}/api/mcp/catalog/generate-draft`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        media_id,
        seller_hints: seller_hints || extracted_title || '',
        analysis,
      }),
    });
    const draft = await draftRes.json();

    return NextResponse.json({
      ...draft,
      image_url,
      media_id,
      seller_id: userId,
      suggested_price: draft.suggested_price || extracted_price,
    });
  } catch (error) {
    console.error('POST /api/seller/listings/draft error:', error);
    return NextResponse.json({ error: 'Failed to create listing draft' }, { status: 500 });
  }
}
