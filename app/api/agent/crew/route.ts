import { NextRequest, NextResponse } from 'next/server';
import { executeCrewPipeline } from '@/lib/crew-agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { keywords, categoryHint, baseCost = 1200, message, query } = body;

    const inputMsg = message || query || keywords || 'running shoes';
    if (!keywords && (message || query)) {
      keywords = inputMsg
        .replace(/search for|find|under\s*\d+|below\s*\d+|less than\s*\d+/gi, '')
        .trim();
      const priceMatch = inputMsg.match(/under\s*₹?\s*(\d+)|below\s*₹?\s*(\d+)|less than\s*₹?\s*(\d+)/i);
      if (priceMatch) {
        baseCost = Number(priceMatch[1] || priceMatch[2] || priceMatch[3]);
      }
    }

    const crewResult = await executeCrewPipeline({
      keywords: keywords || 'running shoes',
      categoryHint,
      baseCost,
    });

    return NextResponse.json({
      success: true,
      crew: 'ShopEZ 3-Agent Autonomous Multi-Agent Pipeline',
      agents: [
        '1. Product Sourcing & Listing Agent',
        '2. Market Intelligence & Pricing Agent',
        '3. Customer Experience & Deals Agent',
      ],
      result: crewResult,
    });
  } catch (error: any) {
    console.error('Crew pipeline error:', error);
    return NextResponse.json({ error: 'Failed to run Multi-Agent Crew' }, { status: 500 });
  }
}
