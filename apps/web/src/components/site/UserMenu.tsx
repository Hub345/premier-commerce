"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { getBrowserSupabase, isAuthAvailable } from "@/lib/supabase/client";

export interface MemberSummary {
  fullName: string | null;
  email: string | null;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const itemClass =
  "block cursor-pointer rounded-lg px-3 py-2.5 text-sm text-ink-soft outline-none transition-colors data-[highlighted]:bg-paper data-[highlighted]:text-ink";

export function UserMenu({ member }: { member: MemberSummary | null }) {
  const router = useRouter();
  const initials = member?.fullName ? initialsOf(member.fullName) : null;
  const firstName = member?.fullName?.split(" ")[0] ?? "there";

  async function handleSignOut() {
    if (isAuthAvailable()) {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Account"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink"
        >
          {initials ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {initials}
            </span>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.4" />
              <path d="M5.5 20a6.5 6.5 0 0113 0" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-soft"
        >
          {member ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">Welcome, {firstName}</p>
                  <p className="truncate text-xs text-ink-muted">{member.email}</p>
                </div>
              </div>
              <div className="py-1.5">
                <DropdownMenu.Item asChild>
                  <Link href="/account" className={itemClass}>My Account</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/account/orders" className={itemClass}>Orders</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/favorites" className={itemClass}>Favorites</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/account/subscriptions" className={itemClass}>Manage Subscriptions</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link href="/rewards" className={itemClass}>Rewards</Link>
                </DropdownMenu.Item>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item onSelect={handleSignOut} className={itemClass}>
                Sign Out
              </DropdownMenu.Item>
            </>
          ) : (
            <div className="py-1">
              <DropdownMenu.Item asChild>
                <Link href="/sign-in" className={itemClass}>Sign In / Sign Up</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/register-product" className={itemClass}>Register a Product</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/order-lookup" className={itemClass}>Order Look Up</Link>
              </DropdownMenu.Item>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
