import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

// The signed-in Supabase user, or null (guest / no Supabase configured).
// Memoized per request — Header, pages, and route handlers share one call.
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!hasSupabaseEnv()) return null;
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export interface Member {
  userId: string;
  email: string | null;
  fullName: string | null;
  /** True once a `customers` row links this user to THIS tenant. */
  onboarded: boolean;
}

// "Onboarded" is tenant-scoped, not global: a Google sign-in already carries
// a full_name, but a customers row (this business's membership) still needs
// creating — so we gate on that row's existence, not just having a name.
// Command Center gate: reuses the RLS-facing is_business_member() SQL
// function (auth.uid()-scoped), so "who can administer this tenant" is the
// exact same rule the database already enforces — no shadow auth system,
// no hardcoded password.
export const isBusinessAdmin = cache(async (businessId: string): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("is_business_member", {
    p_business_id: businessId,
  });
  return !error && data === true;
});

export const getCurrentMember = cache(
  async (businessId: string): Promise<Member | null> => {
    const user = await getSessionUser();
    if (!user) return null;

    const supabase = await getServerSupabase();
    const service = getServiceSupabase();

    // Independent reads (profile is global, customer is tenant-scoped) — run
    // them concurrently rather than paying two sequential round trips.
    const [{ data: profile }, { data: customer }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      service
        .from("customers")
        .select("id")
        .eq("business_id", businessId)
        .eq("auth_user_id", user.id)
        .maybeSingle(),
    ]);

    return {
      userId: user.id,
      email: user.email ?? null,
      fullName: (profile as { full_name: string | null } | null)?.full_name ?? null,
      onboarded: Boolean(customer),
    };
  },
);
