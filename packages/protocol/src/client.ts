// The Standard Commerce Protocol — one typed contract, two consumers.
// The web storefront implements/consumes this today; the Flutter admin app
// consumes the identical surface tomorrow. Neither talks to Postgres directly.

import type {
  Category,
  CreateOrderInput,
  Order,
  OrderStatus,
  Paginated,
  PaymentStatus,
  Product,
  ProductFilters,
  ProductQuery,
  ProductVariant,
  UUID,
} from "./types";

// ─── Admin input shapes ─────────────────────────────────────────────────

export interface VariantInput {
  sku?: string;
  label?: string;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  attributes?: Record<string, string | number | boolean>;
  images?: string[];
  isDefault?: boolean;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string | null;
  status?: "draft" | "published" | "archived";
  attributes?: Record<string, string | number | boolean>;
  images?: string[];
  variants: VariantInput[];
}

export interface OrderQuery {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

export interface InventoryAdjustment {
  variantId: UUID;
  /** Signed delta: +N to restock, -N to correct down. */
  delta: number;
  reason: "restock" | "adjustment" | "correction";
  note?: string;
}

// ─── Consumer-facing storefront surface ─────────────────────────────────

export interface CatalogSurface {
  listProducts(query?: ProductQuery): Promise<Paginated<Product>>;
  getProduct(slug: string): Promise<Product>;
  listCategories(): Promise<Category[]>;
  search(term: string, filters?: ProductFilters): Promise<Product[]>;
}

export interface CheckoutSurface {
  /**
   * The server reprices every line from the database and computes VAT.
   * Client-supplied totals are never trusted.
   */
  createOrder(input: CreateOrderInput): Promise<Order>;
}

export interface PaymentsSurface {
  initiateMpesa(
    orderId: UUID,
    phone: string,
  ): Promise<{ checkoutRequestId: string }>;
  /** The reconciliation poll for when the STK callback never arrives. */
  getStatus(orderId: UUID): Promise<PaymentStatus>;
}

export interface OrdersSurface {
  /** Guest order tracking — reference + phone, no account required. */
  lookup(reference: string, phone: string): Promise<Order>;
}

// ─── Authenticated admin surface (never imported by the storefront) ─────

export interface AdminSurface {
  products: {
    list(query?: ProductQuery): Promise<Paginated<Product>>;
    get(id: UUID): Promise<Product>;
    create(input: ProductInput): Promise<Product>;
    update(id: UUID, input: Partial<ProductInput>): Promise<Product>;
    remove(id: UUID): Promise<void>;
  };
  variants: {
    upsert(productId: UUID, variant: VariantInput): Promise<ProductVariant>;
    remove(variantId: UUID): Promise<void>;
  };
  inventory: {
    adjust(input: InventoryAdjustment): Promise<void>;
  };
  orders: {
    list(query?: OrderQuery): Promise<Paginated<Order>>;
    updateStatus(orderId: UUID, status: OrderStatus): Promise<Order>;
  };
}

/** The complete protocol. A concrete client (HTTP, Supabase, mock) implements it. */
export interface CommerceClient {
  catalog: CatalogSurface;
  checkout: CheckoutSurface;
  payments: PaymentsSurface;
  orders: OrdersSurface;
  admin: AdminSurface;
}
