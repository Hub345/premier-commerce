// Shared by the server (nav.ts builds it) and the client (MegaMenu renders it).
// Kept free of "server-only" so a client component can import the type safely.

export interface NavChild {
  id: string;
  name: string;
  slug: string;
}

// Recursive: a category tree can be any depth (e.g. Phones > Smartphones >
// Samsung), not just two levels. Existing code that only reads id/name/slug
// off a child (the flat NavChild shape) keeps working unchanged.
export interface NavNode extends NavChild {
  children: NavNode[];
}
