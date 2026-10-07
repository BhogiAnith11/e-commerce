import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const session = await getServerSession();
    const { image_base64, seller_id, content_type = 'image/jpeg' } = await req.json();

    const resolvedSellerId = seller_id || session?.user?.id || '000000000000000000000001';

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    const buffer = Buffer.from(image_base64, 'base64');
    const ext = content_type.split('/')[1] || 'jpg';
    const key = `media/${resolvedSellerId}/${uuidv4()}.${ext}`;

    let image_url = '';
    try {
      image_url = await uploadToS3(key, buffer, content_type);
    } catch (s3Err) {
      console.warn('S3 upload fallback to base64 data URL:', s3Err);
      image_url = `data:${content_type};base64,${image_base64}`;
    }

    const media_id = uuidv4();

    return NextResponse.json({ media_id, image_url, key });
  } catch (error) {
    console.error('ingest_image error:', error);
    return NextResponse.json({ error: 'Failed to ingest image' }, { status: 500 });
  }
}
