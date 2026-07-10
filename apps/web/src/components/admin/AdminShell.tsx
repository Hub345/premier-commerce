"use client";

import { useState } from "react";
import type { Business } from "@premier/protocol";
import type { AdminCategoryRow, AdminProduct } from "@/lib/catalog";
import type { TeamData } from "@/lib/team";
import type { PulseMetrics } from "@/lib/pulse";
import type { SetupProgress as SetupProgressData } from "@/lib/setup";
import { Pulse } from "@/components/admin/Pulse";
import { SetupProgress } from "@/components/admin/SetupProgress";
import { ThemeLab } from "@/components/admin/ThemeLab";
import { AtomicVault } from "@/components/admin/AtomicVault";
import { TeamManager } from "@/components/admin/TeamManager";
import { AuraToggle } from "@/components/admin/AuraToggle";

type View = "pulse" | "stage" | "vault" | "team";

export function AdminShell({
  business,
  categories,
  products,
  team,
  pulse,
  setup,
  currentUserId,
  isOwner,
}: {
  business: Business;
  categories: AdminCategoryRow[];
  products: AdminProduct[];
  team: TeamData;
  pulse: PulseMetrics;
  setup: SetupProgressData;
  currentUserId: string;
  isOwner: boolean;
}) {
  const [view, setView] = useState<View>("pulse");

  // Team management is owner-only (server-enforced in the API routes too —
  // this just keeps a non-owner from seeing a tab they can't use).
  const nav: { id: View; label: string; enabled: boolean }[] = [
    { id: "pulse", label: "Pulse", enabled: true },
    { id: "stage", label: "Stage Manager", enabled: true },
    { id: "vault", label: "Atomic Vault", enabled: true },
    ...(isOwner ? [{ id: "team" as View, label: "Team", enabled: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 transition-colors duration-500 dark:bg-zinc-950 dark:text-zinc-100 [font-family:var(--font-geist-sans),sans-serif]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white/70 p-5 transition-colors duration-500 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
              Zenith
            </p>
            <p className="mt-1 text-sm font-semibold">Command Center</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              {business.name}
            </p>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {nav.map((item) => {
              const active = item.id === view;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.enabled}
                  onClick={() => item.enabled && setView(item.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                      : item.enabled
                        ? "text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200"
                        : "cursor-default text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {item.label}
                  {!item.enabled ? (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-700">
                      Soon
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            <SetupProgress data={setup} onNavigate={setView} />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Aura
              </span>
              <AuraToggle />
            </div>
            <a
              href="/"
              className="block rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              &larr; Back to storefront
            </a>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {view === "pulse" ? (
            <Pulse metrics={pulse} currency={business.currency} />
          ) : view === "stage" ? (
            <ThemeLab business={business} categories={categories} />
          ) : view === "vault" ? (
            <AtomicVault products={products} categories={categories} currency={business.currency} />
          ) : view === "team" && isOwner ? (
            <TeamManager members={team.members} invites={team.invites} currentUserId={currentUserId} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
