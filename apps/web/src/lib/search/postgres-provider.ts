import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SearchProvider, SearchRequest, SearchResult } from "@premier/protocol";
import { mapProduct } from "@/lib/mappers";

interface RankRow {
  product_id: string;
  score: number;
}

// v1 search backend. Ranking comes from the database `search_products` RPC
// (a generated tsvector + trigram fallback); this class fetches and shapes the
// matching products. Implements the same SearchProvider a future Meilisearch or
// Algolia adapter will — so swapping backends never touches the frontend.
export class PostgresSearchProvider implements SearchProvider {
  readonly name = "postgres-fts";

  constructor(private readonly supabase: SupabaseClient) {}

  async query(req: SearchRequest): Promise<SearchResult> {
    const page = req.page ?? 1;
    const pageSize = req.pageSize ?? 24;
    const offset = (page - 1) * pageSize;

    const { data: ranked, error } = await this.supabase.rpc("search_products", {
      p_business_id: req.businessId,
      p_term: req.term ?? "",
      p_limit: pageSize,
      p_offset: offset,
    });

    const rows = (ranked ?? []) as RankRow[];
    if (error || rows.length === 0) {
      return { items: [], total: 0, page, pageSize, term: req.term };
    }

    const scores = new Map<string, number>(rows.map((r) => [r.product_id, r.score]));
    const ids = [...scores.keys()];

    const { data: products } = await this.supabase
      .from("products")
      .select("*, product_variants(*)")
      .in("id", ids);

    const items = ((products ?? []) as Record<string, unknown>[])
      .map(mapProduct)
      .map((product) => ({ product, score: scores.get(product.id) ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return { items, total: items.length, page, pageSize, term: req.term };
  }

  // The generated tsvector column is maintained by the write path, so there is
  // nothing to push to an external index.
  async index(): Promise<void> {}
  async remove(): Promise<void> {}
}
