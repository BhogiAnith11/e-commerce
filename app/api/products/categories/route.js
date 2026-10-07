import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

const DEFAULT_CATEGORIES = ['Electronics', 'Footwear', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];

function toTitleCase(str){
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export async function GET(req) {
  try {
    await connectDB();

    // Get all distinct categories from published products added by merchants
    const dbCategories = await Product.distinct('category', { status: 'published' });

    // Deduplicate case-insensitively and format into Title Case
    const categoryMap = new Map<string, string>();
    categoryMap.set('all', 'All');

    // Add merchant categories first
    for (const c of dbCategories) {
      if (c && typeof c === 'string' && c.trim()) {
        const formatted = toTitleCase(c);
        categoryMap.set(formatted.toLowerCase(), formatted);
      }
    }

    // Add standard popular categories if not already present
    for (const def of DEFAULT_CATEGORIES) {
      if (!categoryMap.has(def.toLowerCase())) {
        categoryMap.set(def.toLowerCase(), def);
      }
    }

    const categories = Array.from(categoryMap.values());
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/products/categories error:', error);
    return NextResponse.json({ categories: ['All', ...DEFAULT_CATEGORIES] });
  }
}
