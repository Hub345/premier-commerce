// Domain types for the Standard Commerce Protocol.
// Shared verbatim by the web storefront and the future Flutter admin app.
// If a shape changes here, both consumers see it at compile time.

/** Money is always integer minor units (cents). Never a float. */
export type Cents = number;

export type UUID = string;
export type ISODateString = string;

export type CurrencyCode = "KES" | "USD";

export interface VatConfig {
  enabled: boolean;
  /** Fractional rate, e.g. 0.16 for 16%. */
  rate: number;
  registrationNumber: string | null;
}

/** One of a fixed, preloaded set — not an arbitrary font-family string. */
export type FontChoice = "geist" | "inter" | "playfair";

export interface BusinessBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  /** Hex accent color used for highlights/badges, e.g. "#D8A24A". */
  accent: string | null;
  /** Hex primary color used for primary CTAs, e.g. "#161613" or "#A50034". */
  primary: string | null;
  fontFamily: FontChoice | null;
  tagline: string | null;
  heroHeadline: string | null;
  heroSubcopy: string | null;
}

export interface BusinessBenefit {
  title: string;
  copy: string;
}

export interface BusinessContact {
  phone: string | null;
  email: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  xUrl: string | null;
}

export interface Business {
  id: UUID;
  slug: string;
  name: string;
  currency: CurrencyCode;
  branding: BusinessBranding;
  contact: BusinessContact;
  benefits: BusinessBenefit[];
  vat: VatConfig;
  status: "active" | "suspended";
}

export interface Category {
  id: UUID;
  slug: string;
  name: string;
  parentId: UUID | null;
  position: number;
}

/** Arbitrary, tenant-defined specifications (RAM, screen size, color…). */
export type ProductAttributes = Record<string, string | number | boolean>;

export interface ProductVariant {
  id: UUID;
  sku: string | null;
  label: string | null;
  priceCents: Cents;
  /** Optional compare-at ("was") price for showing a discount. */
  compareAtCents: Cents | null;
  stock: number;
  attributes: ProductAttributes;
  images: string[];
  isDefault: boolean;
}

export interface Product {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  categoryId: UUID | null;
  status: "draft" | "published" | "archived";
  attributes: ProductAttributes;
  images: string[];
  variants: ProductVariant[];
  /** Convenience for cards/lists: the lowest variant price. */
  fromPriceCents: Cents;
  createdAt: ISODateString;
}

export interface Customer {
  id: UUID;
  phone: string;
  name: string | null;
  email: string | null;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: UUID;
  variantId: UUID | null;
  /** Name + price are frozen at purchase time — the catalog may change later. */
  nameSnapshot: string;
  variantLabel: string | null;
  unitPriceCents: Cents;
  quantity: number;
  lineTotalCents: Cents;
}

export interface Order {
  id: UUID;
  reference: string;
  status: OrderStatus;
  customer: Customer | null;
  items: OrderItem[];
  subtotalCents: Cents;
  vatCents: Cents;
  totalCents: Cents;
  currency: CurrencyCode;
  createdAt: ISODateString;
}

export type PaymentProvider = "mpesa" | "stripe";

export type PaymentStatus =
  | "initiated"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

export interface Payment {
  id: UUID;
  orderId: UUID;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: Cents;
  providerRef: string | null;
  createdAt: ISODateString;
}

// ─── Query & input shapes ───────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductFilters {
  categorySlug?: string;
  minPriceCents?: Cents;
  maxPriceCents?: Cents;
  inStockOnly?: boolean;
  /** Attribute equality filters, e.g. { brand: "Samsung" }. */
  attributes?: ProductAttributes;
}

export type ProductSort = "relevance" | "price_asc" | "price_desc" | "newest";

export interface ProductQuery {
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface CreateOrderItemInput {
  variantId: UUID;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  customer: {
    phone: string;
    name?: string;
    email?: string;
  };
  note?: string;
}
