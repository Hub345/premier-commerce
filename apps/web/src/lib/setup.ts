import "server-only";
import type { Business } from "@premier/protocol";
import type { AdminCategoryRow, AdminProduct } from "@/lib/catalog";
import { hasSupabaseEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase/admin";

// The Hostinger-style "Go Live" checklist. Every step reflects REAL state in
// the tenant's data — nothing is a hardcoded "todo". A step is done because
// the underlying thing genuinely exists (a headline is set, a product is
// published, M-Pesa keys are present), so the progress ring is an honest
// picture of how close the store is to launch.

export type SetupView = "pulse" | "stage" | "vault" | "team";

export interface SetupStep {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  /** Admin tab to jump to for this step, if there's a control for it. */
  view: SetupView | null;
}

export interface SetupProgress {
  steps: SetupStep[];
  done: number;
  total: number;
}

async function isMpesaConnected(businessId: string): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = getServiceSupabase();
  // Shortcode/passkey alone don't make payments work — the consumer key/secret
  // are what actually authenticate against Daraja, so that's the real gate.
  const { data } = await supabase
    .from("business_payment_configs")
    .select("mpesa_consumer_key")
    .eq("business_id", businessId)
    .maybeSingle();
  const key = (data as { mpesa_consumer_key?: string | null } | null)?.mpesa_consumer_key;
  return Boolean(key && key.trim());
}

export async function getSetupProgress(
  businessId: string,
  business: Business,
  categories: AdminCategoryRow[],
  products: AdminProduct[],
): Promise<SetupProgress> {
  const b = business.branding;
  const mpesaConnected = await isMpesaConnected(businessId);

  const steps: SetupStep[] = [
    {
      id: "headline",
      label: "Write your hero headline",
      hint: "The first line customers read on your home page.",
      done: Boolean(b.heroHeadline && b.heroHeadline.trim()),
      view: "stage",
    },
    {
      id: "brand",
      label: "Set your brand colors",
      hint: "Your accent and primary color skin the whole store.",
      done: Boolean(b.accent && b.primary),
      view: "stage",
    },
    {
      id: "background",
      label: "Add a hero background",
      hint: "Drop an image or video onto your home Stage.",
      done: Boolean(b.heroBgMediaUrl),
      view: "stage",
    },
    {
      id: "product",
      label: "Publish your first product",
      hint: "At least one live product so customers can buy.",
      done: products.some((p) => p.status === "published"),
      view: "vault",
    },
    {
      id: "featured",
      label: "Feature categories",
      hint: "Curate the Grand Gallery on your Shop page.",
      done: categories.some((c) => c.isFeatured),
      view: "stage",
    },
    {
      id: "mpesa",
      label: "Connect M-Pesa",
      hint: "Add your Daraja consumer key/secret to accept payments.",
      done: mpesaConnected,
      view: null,
    },
  ];

  return { steps, done: steps.filter((s) => s.done).length, total: steps.length };
}
