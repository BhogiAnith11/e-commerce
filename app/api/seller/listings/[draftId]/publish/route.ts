import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

/**
 * POST /api/seller/listings/[draftId]/publish
 * BFF wrapper: moderate + publish in one call.
 * Used by the manual edit form's "Publish" button.
 * BRD BR-04: seller_confirmed must be explicitly passed as true.
 *
 * Body:
 *   { seller_confirmed, final_price, title, description, category, tags, image_url, media_id, stock }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { draftId } = await params;
    const userId = (session.user as { id?: string }).id!;
    const body = await req.json();

    const {
      seller_confirmed,
      final_price,
      title,
      description,
      category,
      tags,
      image_url,
      media_id,
      stock = 1,
    } = body;

    // Hard gate — mirrors publish_listing MCP tool enforcement
    if (seller_confirmed !== true) {
      return NextResponse.json(
        { error: 'seller_confirmed must be true. Explicit approval is required before publishing.' },
        { status: 400 }
      );
    }

    if (!final_price || !title || !image_url) {
      return NextResponse.json(
        { error: 'final_price, title, and image_url are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const cookieHeader = req.headers.get('cookie') || '';
    const headers = { 'Content-Type': 'application/json', Cookie: cookieHeader };

    // Step 1: Moderate
    const moderateRes = await fetch(`${baseUrl}/api/mcp/catalog/moderate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description, category, tags, image_url }),
    });
    const moderation = await moderateRes.json();

    if (!moderation.passed) {
      return NextResponse.json(
        {
          error: `Listing did not pass moderation: ${moderation.reason}`,
          moderation,
        },
        { status: 422 }
      );
    }

    // Step 2: Publish (only after moderation passes and seller_confirmed=true)
    const publishRes = await fetch(`${baseUrl}/api/mcp/catalog/publish`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        draft_id: draftId,
        seller_confirmed: true,
        final_price,
        title,
        description,
        category,
        tags,
        image_url,
        media_id,
        seller_id: userId,
        stock,
      }),
    });
    const publishResult = await publishRes.json();

    return NextResponse.json(publishResult, { status: publishRes.ok ? 201 : 500 });
  } catch (error) {
    console.error('POST /api/seller/listings/[draftId]/publish error:', error);
    return NextResponse.json({ error: 'Failed to publish listing' }, { status: 500 });
  }
}
