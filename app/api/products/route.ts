import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * GET /api/products
 * Public storefront product listing.
 * Query params:
 *   - query: text search (title/description)
 *   - category: filter by category
 *   - max_price: maximum price filter
 *   - min_price: minimum price filter
 *   - sort: price_asc | price_desc | newest (default: newest)
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20, max: 50)
 *   - featured: if "true", return trending/featured products
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const maxPrice = searchParams.get('max_price');
    const minPrice = searchParams.get('min_price');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const featured = searchParams.get('featured') === 'true';

    await connectDB();

    // Build MongoDB filter
    const filter: Record<string, unknown> = { status: 'published' };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];
    }

    if (category) {
      filter.category = { $regex: `^${category}$`, $options: 'i' };
    }

    if (maxPrice || minPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    // Sort
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    else if (sort === 'price_desc') sortQuery = { price: -1 };

    // For featured: just take the latest published (could be expanded with view-count etc.)
    const effectiveLimit = featured ? 8 : limit;
    const skip = featured ? 0 : (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(effectiveLimit)
        .select('title description category tags price stock imageUrl status createdAt')
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit: effectiveLimit,
        total,
        totalPages: Math.ceil(total / effectiveLimit),
      },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
