// The search abstraction — the seam that keeps search portable.
// v1 is backed by Postgres full-text search. A later Meilisearch/Algolia
// adapter implements this same interface and the frontend never changes.

import type {
  Paginated,
  Product,
  ProductFilters,
  ProductSort,
  UUID,
} from "./types";

/** A denormalized, index-friendly view of a product. */
export interface SearchDocument {
  id: UUID;
  businessId: UUID;
  slug: string;
  name: string;
  description: string | null;
  categorySlug: string | null;
  brand: string | null;
  fromPriceCents: number;
  inStock: boolean;
  attributes: Record<string, string | number | boolean>;
}

export interface SearchRequest {
  /** Always tenant-scoped — resolved server-side, never from the client. */
  businessId: UUID;
  term: string;
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface SearchHit {
  product: Product;
  /** Provider-specific relevance score; higher is better. */
  score: number;
}

export interface SearchResult extends Paginated<SearchHit> {
  term: string;
}

export interface SearchProvider {
  /** Human-readable id, e.g. "postgres-fts" or "meilisearch". */
  readonly name: string;

  query(req: SearchRequest): Promise<SearchResult>;

  /**
   * Index maintenance. A no-op for the Postgres provider — there, the database
   * generated tsvector column *is* the index, kept current by the write path.
   */
  index(docs: SearchDocument[]): Promise<void>;

  remove(businessId: UUID, productIds: UUID[]): Promise<void>;
}
