import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { isBusinessOwner } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const roleSchema = z.enum(["owner", "manager", "staff"]);

async function ownerCount(
  service: ReturnType<typeof getServiceSupabase>,
  businessId: string,
): Promise<number> {
  const { count } = await service
    .from("business_members")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("role", "owner");
  return count ?? 0;
}

const patchSchema = z.object({ profileId: z.string().uuid(), role: roleSchema });

export async function PATCH(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessOwner(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const service = getServiceSupabase();

  // Never leave a business with zero owners — it would lock everyone out of
  // the Command Center's most privileged actions with no recovery path
  // short of a manual SQL fix.
  if (parsed.data.role !== "owner") {
    const { data: current } = await service
      .from("business_members")
      .select("role")
      .eq("business_id", business.id)
      .eq("profile_id", parsed.data.profileId)
      .maybeSingle();
    const wasOwner = (current as { role: string } | null)?.role === "owner";
    if (wasOwner && (await ownerCount(service, business.id)) <= 1) {
      return NextResponse.json({ error: "last_owner" }, { status: 400 });
    }
  }

  const { error } = await service
    .from("business_members")
    .update({ role: parsed.data.role })
    .eq("business_id", business.id)
    .eq("profile_id", parsed.data.profileId);

  if (error) {
    return NextResponse.json({ error: "role_update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({ profileId: z.string().uuid() });

export async function DELETE(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessOwner(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const service = getServiceSupabase();

  const { data: current } = await service
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("profile_id", parsed.data.profileId)
    .maybeSingle();
  const wasOwner = (current as { role: string } | null)?.role === "owner";
  if (wasOwner && (await ownerCount(service, business.id)) <= 1) {
    return NextResponse.json({ error: "last_owner" }, { status: 400 });
  }

  const { error } = await service
    .from("business_members")
    .delete()
    .eq("business_id", business.id)
    .eq("profile_id", parsed.data.profileId);

  if (error) {
    return NextResponse.json({ error: "remove_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
