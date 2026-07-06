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

  const roots: NavNode[] = [];
  const rootById = new Map<string, NavNode>();

  for (const c of rows) {
    if (c.parent_id === null) {
      const node: NavNode = { id: c.id, name: c.name, slug: c.slug, children: [] };
      roots.push(node);
      rootById.set(c.id, node);
    }
  }

  for (const c of rows) {
    if (c.parent_id === null) continue;
    const parent = rootById.get(c.parent_id);
    if (parent) {
      parent.children.push({ id: c.id, name: c.name, slug: c.slug });
    }
  }

  return roots;
}
