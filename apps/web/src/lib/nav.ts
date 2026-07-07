import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { demoNavTree } from "@/lib/demo-data";
import type { NavNode } from "@/lib/nav-types";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number;
}

// The mega-menu is generated from the categories tree — one source of truth.
// Add a category in the DB and it appears in navigation automatically.
export async function getNavigationTree(businessId: string): Promise<NavNode[]> {
  if (!hasSupabaseEnv()) return demoNavTree;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, position")
    .eq("business_id", businessId)
    .order("position", { ascending: true });

  if (error || !data) return [];
  const rows = data as CategoryRow[];

  // Generic tree build — any depth (Phones > Smartphones > Samsung, and
  // beyond), not hardcoded to two levels.
  const nodeById = new Map<string, NavNode>();
  for (const c of rows) {
    nodeById.set(c.id, { id: c.id, name: c.name, slug: c.slug, children: [] });
  }

  const roots: NavNode[] = [];
  for (const c of rows) {
    const node = nodeById.get(c.id)!;
    if (c.parent_id === null) {
      roots.push(node);
    } else {
      nodeById.get(c.parent_id)?.children.push(node);
    }
  }

  return roots;
}
