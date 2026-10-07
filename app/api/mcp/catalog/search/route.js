import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/algolia';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

function buildKeywordFilter(rawQuery) {
  const stopWords = new Set(['find', 'show', 'me', 'looking', 'for', 'a', 'an', 'the', 'some', 'please', 'i', 'want', 'need']);
  const words = rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  if (words.length === 0) return { status: 'published' };

  return {
    status: 'published',
    $or: words.flatMap((w) => [
      { title: { $regex: w, $options: 'i' } },
      { description: { $regex: w, $options: 'i' } },
      { category: { $regex: w, $options: 'i' } },
      { tags: { $in: [new RegExp(w, 'i')] } },
    ]),
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const maxPrice = searchParams.get('max_price');
    const category = searchParams.get('category') || undefined;

    let results[] = [];

    // Try Algolia
    try {
      results = await searchProducts(query, {
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        category,
      });
    } catch (algoliaErr) {
      // Algolia fallback to Mongo
    }

    if (!results || results.length === 0) {
      await connectDB();
      const filter = buildKeywordFilter(query);
      if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };
      if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };

      const dbProducts = await Product.find(filter).limit(20).lean();
      results = dbProducts.map((p) => ({
        objectID: p._id.toString(),
        product_id: p._id.toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        category: p.category,
        stock: p.stock,
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('search_products error:', error);
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { query, filters } = await req.json();
    let results[] = [];

    try {
      results = await searchProducts(query || '', filters);
    } catch (algoliaErr) {
      // Algolia fallback
    }

    if (!results || results.length === 0) {
      await connectDB();
      const filter = buildKeywordFilter(query || '');
      if (filters?.category) filter.category = { $regex: `^${filters.category}$`, $options: 'i' };
      if (filters?.max_price) filter.price = { $lte: parseFloat(filters.max_price) };

      const dbProducts = await Product.find(filter).limit(20).lean();
      results = dbProducts.map((p) => ({
        objectID: p._id.toString(),
        product_id: p._id.toString(),
        title: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        category: p.category,
        stock: p.stock,
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('search_products error:', error);
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
  }
}
