"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MemberRole, PendingInvite, TeamMember } from "@/lib/team";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

function RolePill({ role }: { role: MemberRole }) {
  const map: Record<MemberRole, string> = {
    owner: "bg-amber-400/20 text-amber-600 dark:text-amber-300",
    manager: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    staff: "bg-zinc-400/15 text-zinc-500 dark:text-zinc-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${map[role]}`}>
      {role}
    </span>
  );
}

export function TeamManager({
  members,
  invites,
  currentUserId,
}: {
  members: TeamMember[];
  invites: PendingInvite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [inviting, setInviting] = useState(false);
  const ownerCount = members.filter((m) => m.role === "owner").length;

  async function sendInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setInviting(true);
    try {
      const res = await fetch("/api/v1/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Invited ${trimmed}. They'll get access the moment they sign in with this email.`);
      setEmail("");
      router.refresh();
    } catch {
      toast.error("Couldn't send that invite.");
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: string) {
    try {
      const res = await fetch("/api/v1/admin/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Invite revoked.");
      router.refresh();
    } catch {
      toast.error("Couldn't revoke that invite.");
    }
  }

  async function changeRole(profileId: string, newRole: MemberRole) {
    try {
      const res = await fetch("/api/v1/admin/member", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error === "last_owner") {
          toast.error("Can't do that — every business needs at least one owner.");
        } else {
          throw new Error();
        }
        router.refresh();
        return;
      }
      toast.success("Role updated.");
      router.refresh();
    } catch {
      toast.error("Couldn't update that role.");
    }
  }

  async function removeMember(profileId: string) {
    try {
      const res = await fetch("/api/v1/admin/member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.error === "last_owner") {
          toast.error("Can't remove the last owner.");
        } else {
          throw new Error();
        }
        return;
      }
      toast.success("Removed from the team.");
      router.refresh();
    } catch {
      toast.error("Couldn't remove that person.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
        Access
      </p>
      <h1 className="mt-1 text-lg font-semibold">Team</h1>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white/60 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Invite a teammate
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          No email gets sent — the moment they sign in with this address and open the Command
          Center, they&apos;re granted access automatically.
        </p>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendInvite()}
            placeholder="teammate@example.com"
            className={`${inputClass} flex-1`}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={`${inputClass} w-32`}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={sendInvite}
            disabled={inviting || !email.trim()}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
          >
            {inviting ? "…" : "Invite"}
          </button>
        </div>
      </section>

      {invites.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white/60 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Pending invites
          </h2>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>{inv.email}</span>
                  <RolePill role={inv.role} />
                </div>
                <button
                  type="button"
                  onClick={() => revokeInvite(inv.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white/60 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          Members
        </h2>
        <ul className="space-y-3">
          {members.map((m) => {
            const isSelf = m.profileId === currentUserId;
            const isOnlyOwner = m.role === "owner" && ownerCount <= 1;
            return (
              <li key={m.profileId} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {m.fullName ?? m.email ?? "Unnamed"}
                    {isSelf ? <span className="ml-1.5 text-xs text-zinc-400">(you)</span> : null}
                  </p>
                  {m.email && m.fullName ? (
                    <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{m.email}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.profileId, e.target.value as MemberRole)}
                    disabled={isOnlyOwner}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(m.profileId)}
                    disabled={isOnlyOwner}
                    title={isOnlyOwner ? "Every business needs at least one owner" : undefined}
                    className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-zinc-400"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
