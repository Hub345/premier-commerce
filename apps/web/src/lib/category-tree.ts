// Pure tree-ordering helper shared by admin category UIs (Stage Manager's
// category picker, the Atomic Vault's product-category select). Kept free of
// "server-only" so client components can import it directly.

export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId: string | null;
}

// Flattens a flat, parentId-linked list into tree order (each parent
// immediately followed by its children, recursively) with a depth for
// indentation — works for any nesting depth (Phones > Smartphones > Samsung,
// and beyond), not just two levels.
export function orderCategoriesByTree<T extends CategoryTreeNode>(
  categories: T[],
): { category: T; depth: number }[] {
  const byParent = new Map<string | null, T[]>();
  for (const c of categories) {
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  const out: { category: T; depth: number }[] = [];
  function visit(parentId: string | null, depth: number) {
    for (const c of byParent.get(parentId) ?? []) {
      out.push({ category: c, depth });
      visit(c.id, depth + 1);
    }
  }
  visit(null, 0);
  return out;
}
