import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentBusiness } from "@/lib/tenant";
import { getSessionUser, isBusinessOwner } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const roleSchema = z.enum(["owner", "manager", "staff"]);

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: roleSchema,
});

// Creates (or updates the role on) a pending invite. No email is sent — see
// migration 0011's comment: the invitee just needs to sign in with this
// exact address and visit /admin, and they're auto-provisioned there.
export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "tenant_not_resolved" }, { status: 404 });
  }
  if (!(await isBusinessOwner(business.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const user = await getSessionUser();

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const service = getServiceSupabase();
  const { error } = await service.from("business_invites").upsert(
    {
      business_id: business.id,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user?.id ?? null,
      accepted_at: null,
    },
    { onConflict: "business_id,email" },
  );

  if (error) {
    return NextResponse.json({ error: "invite_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({ inviteId: z.string().uuid() });

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
  const { error } = await service
    .from("business_invites")
    .delete()
    .eq("id", parsed.data.inviteId)
    .eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: "revoke_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
