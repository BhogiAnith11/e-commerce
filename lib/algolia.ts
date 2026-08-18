import { algoliasearch } from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY! // Use admin key server-side for indexing
);

export const PRODUCTS_INDEX = 'products';

export interface AlgoliaProduct {
  objectID: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  stock: number;
  imageUrl: string;
  sellerId: string;
  status: string;
}

export async function indexProduct(product: AlgoliaProduct): Promise<void> {
  await client.saveObject({ indexName: PRODUCTS_INDEX, body: product });
}

export async function deleteProductIndex(objectID: string): Promise<void> {
  await client.deleteObject({ indexName: PRODUCTS_INDEX, objectID });
}

export async function searchProducts(
  query: string,
  filters?: { maxPrice?: number; category?: string }
): Promise<AlgoliaProduct[]> {
  const filterParts: string[] = ['status:published'];
  if (filters?.category) filterParts.push(`category:"${filters.category}"`);
  if (filters?.maxPrice !== undefined) filterParts.push(`price <= ${filters.maxPrice}`);

  const { hits } = await client.searchSingleIndex({
    indexName: PRODUCTS_INDEX,
    searchParams: {
      query,
      filters: filterParts.join(' AND '),
      hitsPerPage: 20,
    },
  });

  return hits as unknown as AlgoliaProduct[];
}

export { client as algoliaClient };
