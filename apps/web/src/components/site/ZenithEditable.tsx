"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

// The query param LivePreviewFrame appends when it loads a storefront page
// inside the admin's Stage Manager — signals "render the click-to-edit
// affordances," never present for a real visitor.
const EDIT_PARAM = "__zenith_edit";

export type EditKind = "text" | "textarea" | "gradient" | "image";

export interface EditPayload {
  source: "zenith-storefront";
  type: "edit";
  /** Which admin endpoint/field this maps to — read by EditHud. */
  scope: "business" | "category";
  field: string;
  label: string;
  kind: EditKind;
  value: string | null;
  /** Extra context the HUD needs to build the PATCH body, e.g. { categoryId }. */
  meta?: Record<string, string>;
}

export function useZenithEditMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get(EDIT_PARAM) === "1";
}

// A small pencil affordance pinned to the corner of whatever it wraps.
// Deliberately NOT a click-handler on the content itself — the content is
// often a <Link> or sits inside one, and hijacking clicks there would break
// normal navigation. The edit affordance is its own, separate hit target.
export function ZenithEditable({
  payload,
  className,
  children,
}: {
  payload: Omit<EditPayload, "source" | "type">;
  className?: string;
  children: ReactNode;
}) {
  const editing = useZenithEditMode();
  if (!editing) return <>{children}</>;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage(
      { source: "zenith-storefront", type: "edit", ...payload } satisfies EditPayload,
      window.location.origin,
    );
  }

  return (
    <span className={`group/zedit relative inline-block ${className ?? ""}`}>
      {children}
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Edit ${payload.label}`}
        className="absolute -right-3 -top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink opacity-0 shadow-soft transition-opacity group-hover/zedit:opacity-100"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 6l4 4-8 8H6v-4l8-8zM12 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-lg opacity-0 outline outline-2 outline-dashed outline-[var(--accent)] transition-opacity group-hover/zedit:opacity-60" />
    </span>
  );
}
