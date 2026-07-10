import "server-only";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export type MemberRole = "owner" | "manager" | "staff";

export interface TeamMember {
  profileId: string;
  fullName: string | null;
  email: string | null;
  role: MemberRole;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: MemberRole;
  createdAt: string;
}

export interface TeamData {
  members: TeamMember[];
  invites: PendingInvite[];
}

// Reads via the user-scoped (RLS) client — business_invites_member_all and
// members_read both already permit any member of this business to see this.
// Email isn't stored on `profiles` (only on auth.users, which client code
// can't query directly), so we ask auth for it via a small RPC-free path:
// business_members already scopes to real members, and we only need the
// invitee's email for *invites* (stored directly on business_invites) — for
// existing members we show what we have (name) and fall back to the id.
export async function getTeamForAdmin(businessId: string): Promise<TeamData> {
  if (!hasSupabaseEnv()) return { members: [], invites: [] };
  const supabase = await getServerSupabase();

  const [membersRes, invitesRes] = await Promise.all([
    supabase
      .from("business_members")
      .select("profile_id, role, profiles(full_name)")
      .eq("business_id", businessId),
    supabase
      .from("business_invites")
      .select("id, email, role, created_at")
      .eq("business_id", businessId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const rawMembers = (membersRes.data ?? []) as Record<string, unknown>[];

  // Email lives only on auth.users, not `profiles` — resolve it via the
  // admin API. Small team sizes make N parallel lookups fine; not worth a
  // bulk endpoint for what's realistically a handful of staff.
  const service = getServiceSupabase();
  const emails = await Promise.all(
    rawMembers.map(async (m) => {
      const { data } = await service.auth.admin.getUserById(String(m.profile_id));
      return data.user?.email ?? null;
    }),
  );

  const members: TeamMember[] = rawMembers.map((m, i) => ({
    profileId: String(m.profile_id),
    fullName: (m.profiles as { full_name: string | null } | null)?.full_name ?? null,
    email: emails[i] ?? null,
    role: m.role as MemberRole,
  }));

  const invites: PendingInvite[] = ((invitesRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
    id: String(i.id),
    email: String(i.email),
    role: i.role as MemberRole,
    createdAt: String(i.created_at),
  }));

  return { members, invites };
}

// The self-service half of the invite flow: called from the /admin gate when
// a signed-in, not-yet-a-member user hits the page. If their email matches a
// pending invite, grant membership immediately and mark it accepted — no
// link/token to click, no email to send.
export async function tryAcceptInvite(
  businessId: string,
  userId: string,
  email: string | null,
): Promise<boolean> {
  if (!email) return false;
  const service = getServiceSupabase();

  const { data: invite } = await service
    .from("business_invites")
    .select("id, role")
    .eq("business_id", businessId)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .maybeSingle();
  if (!invite) return false;
  const { id, role } = invite as { id: string; role: MemberRole };

  const { error: memberErr } = await service
    .from("business_members")
    .upsert(
      { business_id: businessId, profile_id: userId, role },
      { onConflict: "business_id,profile_id" },
    );
  if (memberErr) return false;

  await service.from("business_invites").update({ accepted_at: new Date().toISOString() }).eq("id", id);
  return true;
}
