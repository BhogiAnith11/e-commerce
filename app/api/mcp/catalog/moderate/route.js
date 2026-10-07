import { NextRequest, NextResponse } from 'next/server';
import anthropic from '@/lib/anthropic';

const PROHIBITED_KEYWORDS = [
  'weapon', 'gun', 'knife', 'drug', 'narcotic', 'explosive',
  'counterfeit', 'fake', 'replica', 'stolen', 'illegal',
];

export async function POST(req) {
  try {
    const { title, description, category, tags, image_url } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
    }

    // Quick keyword check
    const combinedText = `${title} ${description} ${(tags || []).join(' ')}`.toLowerCase();
    const flaggedKeywords = PROHIBITED_KEYWORDS.filter((kw) => combinedText.includes(kw));
    if (flaggedKeywords.length > 0) {
      return NextResponse.json({
        passed: false,
        reason: `Prohibited content detected: ${flaggedKeywords.join(', ')}`,
        flagged_keywords: flaggedKeywords,
      });
    }

    let result = { passed: true, reason: '', risk_level: 'low' };

    // Claude moderation check
    try {
      const message = await anthropic.messages.create({: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are a content moderator for ShopEZ, an Indian e-commerce platform.
Review this product listing for safety and compliance:

Title: ${title}
Description: ${description}
Category: ${category}
Tags: ${(tags || []).join(', ')}

Check for:
1. Prohibited/illegal items (weapons, drugs, contraband)
2. Intellectual property violations (obvious counterfeits)
3. Misleading or fraudulent claims
4. Adult/explicit content

Return JSON:
{
  "passed": true|false,
  "reason": "explanation if not passed, empty string if passed",
  "risk_level": "low|medium|high"
}
Return ONLY JSON.`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Anthropic API call in moderate_listing failed (fallback to keyword rules):', e?.message);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('moderate_listing error:', error);
    return NextResponse.json({ error: 'Moderation service failed' }, { status: 500 });
  }
}
