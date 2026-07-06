import "server-only";
import { getServiceSupabase } from "@/lib/supabase/admin";

export interface MpesaConfig {
  shortcode: string;
  passkey: string;
  consumerKey: string | null;
  consumerSecret: string | null;
  environment: string;
  base: string;
}

// Per-tenant Daraja credentials. Read only under the service role — these
// secrets never reach a client.
export async function loadMpesaConfig(
  businessId: string,
): Promise<MpesaConfig | null> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("business_payment_configs")
    .select("*")
    .eq("business_id", businessId)
    .eq("provider", "mpesa")
    .maybeSingle();

  if (!data) return null;
  const row = data as Record<string, unknown>;
  const environment = String(row.environment ?? "sandbox");
  return {
    shortcode: String(row.mpesa_shortcode ?? ""),
    passkey: String(row.mpesa_passkey ?? ""),
    consumerKey: (row.mpesa_consumer_key as string | null) ?? null,
    consumerSecret: (row.mpesa_consumer_secret as string | null) ?? null,
    environment,
    base:
      environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke",
  };
}

export function isMpesaReady(cfg: MpesaConfig | null): cfg is MpesaConfig {
  return Boolean(
    cfg && cfg.shortcode && cfg.passkey && cfg.consumerKey && cfg.consumerSecret,
  );
}
