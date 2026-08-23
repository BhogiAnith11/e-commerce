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

    // Build flexible search words
    const searchTerms = query
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    // Build MongoDB filter
    const filter: Record<string, unknown> = { status: 'published' };

    if (searchTerms.length > 0) {
      filter.$or = searchTerms.map((term) => ({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { category: { $regex: term, $options: 'i' } },
          { tags: { $in: [new RegExp(term, 'i')] } },
        ],
      }));
    }

    if (category) {
      const cleanCat = category.replace(/premium\s*/i, '').trim();
      filter.category = { $regex: cleanCat || category, $options: 'i' };
    }

    if (maxPrice || minPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    // Sort options
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    else if (sort === 'price_desc') sortQuery = { price: -1 };
    else if (sort === 'top_rated' || sort === 'rating') sortQuery = { rating: -1, numReviews: -1, createdAt: -1 };

    // For featured: just take the latest published
    const effectiveLimit = featured ? 8 : limit;
    const skip = featured ? 0 : (page - 1) * limit;

    let [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(effectiveLimit)
        .select('title description category tags price stock imageUrl rating numReviews status createdAt')
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Fallback: If no products found with category filter, retry without category filter
    if (products.length === 0 && category && searchTerms.length > 0) {
      const fallbackFilter: Record<string, unknown> = {
        status: 'published',
        $or: searchTerms.map((term) => ({
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { tags: { $in: [new RegExp(term, 'i')] } },
          ],
        })),
      };
      if (maxPrice || minPrice) fallbackFilter.price = filter.price;

      const [fbProducts, fbTotal] = await Promise.all([
        Product.find(fallbackFilter)
          .sort(sortQuery)
          .skip(skip)
          .limit(effectiveLimit)
          .select('title description category tags price stock imageUrl rating numReviews status createdAt')
          .lean(),
        Product.countDocuments(fallbackFilter),
      ]);

      if (fbProducts.length > 0) {
        products = fbProducts;
        total = fbTotal;
      }
    }

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
