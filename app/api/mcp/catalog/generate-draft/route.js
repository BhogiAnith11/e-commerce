import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const { media_id, seller_hints, analysis } = await req.json();

    if (!media_id) {
      return NextResponse.json({ error: 'media_id is required' }, { status: 400 });
    }

    const contextStr = JSON.stringify({ analysis: analysis || {}, seller_hints: seller_hints || '' });
    let draft = null;

    try {
      const message = await anthropic.messages.create({: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a product listing expert for an Indian e-commerce marketplace (ShopEZ).
Based on the following product analysis, generate a compelling product listing draft.

Product Analysis & Seller Hints:
${contextStr}

Return a JSON object with:
{
  "title": "compelling product title (max 80 chars)",
  "description": "detailed product description (3-5 sentences)",
  "category": "main category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggested_price": <number in INR>
}

Base the price on typical Indian marketplace pricing for this product type.
Return ONLY the JSON object.`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[0]);
      }
    } catch (anthropicError) {
      console.warn('Anthropic API call failed in generate_listing_draft (using fallback):', anthropicError?.message);
    }

    // Heuristic fallback if API limit reached
    if (!draft || !draft.title) {
      const cat = analysis?.category || 'Electronics';
      const title = seller_hints
        ? `${seller_hints.slice(0, 50)} - Premium ${cat}`
        : analysis?.suggested_title || `Premium ${cat} Special Edition`;
      const priceMap = {
        Footwear: 2499,
        Clothing: 1299,
        Electronics: 3499,
        Books: 499,
        Home: 1899,
        Sports: 1599,
        Beauty: 799,
      };

      draft = {
        title,
        description: analysis?.description_hints || `Top-rated ${cat} product offering superior build quality, high durability, and exceptional everyday value. Comes with standard manufacturer warranty.`,
        category: cat,
        tags: [cat.toLowerCase(), 'quality', 'new', 'trending', 'shopez'],
        suggested_price: priceMap[cat] || 1999,
      };
    }

    return NextResponse.json({
      draft_id: uuidv4(),
      media_id,
      ...draft,
    });
  } catch (error) {
    console.error('generate_listing_draft error:', error);
    return NextResponse.json({ error: 'Failed to generate listing draft' }, { status: 500 });
  }
}
