import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const { url, seller_id } = await req.json();

    if (!url || !seller_id) {
      return NextResponse.json({ error: 'url and seller_id are required' }, { status: 400 });
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ShopEZ-Bot/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const isImage = contentType.startsWith('image/');

    let image_url;
    let extracted_title | undefined;
    let extracted_price | undefined;
    let extracted_specs = {};

    if (isImage) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = contentType.split('/')[1] || 'jpg';
      const key = `media/${seller_id}/${uuidv4()}.${ext}`;
      image_url = await uploadToS3(key, buffer, contentType);
    } else {
      // HTML page — extract basic info via simple regex
      const html = await response.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      extracted_title = titleMatch?.[1]?.trim();

      // Extract og:image or first img src
      const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
      const imgSrcMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);
      const imageSource = ogImageMatch?.[1] || imgSrcMatch?.[1];

      if (imageSource) {
        const imgRes = await fetch(imageSource);
        if (imgRes.ok) {
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const imgCt = imgRes.headers.get('content-type') || 'image/jpeg';
          const ext = imgCt.split('/')[1] || 'jpg';
          const key = `media/${seller_id}/${uuidv4()}.${ext}`;
          image_url = await uploadToS3(key, imgBuffer, imgCt);
        } else {
          image_url = imageSource;
        }
      } else {
        return NextResponse.json({ error: 'Could not extract image from URL' }, { status: 400 });
      }

      // Price extraction
      const priceMatch = html.match(/[\₹\$][\s]?([0-9,]+(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        extracted_price = parseFloat(priceMatch[1].replace(',', ''));
      }
    }

    const media_id = uuidv4();
    return NextResponse.json({
      media_id,
      image_url: image_url,
      extracted_title,
      extracted_price,
      extracted_specs,
    });
  } catch (error) {
    console.error('ingest_url error:', error);
    return NextResponse.json({ error: 'Failed to ingest URL' }, { status: 500 });
  }
}
