"use client";

import { useState } from "react";
import type { SetupProgress as SetupProgressData, SetupView } from "@/lib/setup";

// The persistent "Go Live" progress widget that lives at the foot of the
// Command Center sidebar. A ring shows how many launch steps are done; opening
// it reveals the checklist, and any step with a control jumps straight to it.
export function SetupProgress({
  data,
  onNavigate,
}: {
  data: SetupProgressData;
  onNavigate: (view: SetupView) => void;
}) {
  const [open, setOpen] = useState(false);
  const { steps, done, total } = data;
  const complete = done >= total;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/60 p-3 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <Ring done={done} total={total} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {complete ? "You're live 🎉" : "Go live"}
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {done}/{total} done
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul className="mt-3 space-y-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {steps.map((step) => {
            const clickable = !step.done && step.view;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && step.view && onNavigate(step.view)}
                  title={step.hint}
                  className={`flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left transition-colors ${
                    clickable
                      ? "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      : "cursor-default"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {step.done ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    ) : (
                      <span className="block h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                    )}
                  </span>
                  <span
                    className={`flex-1 text-[11px] leading-tight ${
                      step.done
                        ? "text-zinc-400 line-through dark:text-zinc-600"
                        : "text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {step.label}
                  </span>
                  {clickable ? (
                    <span className="mt-px shrink-0 font-mono text-[11px] text-zinc-400">→</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const R = 15;
  const C = 2 * Math.PI * R;
  const pct = total > 0 ? done / total : 0;
  const offset = C * (1 - pct);
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle cx="20" cy="20" r={R} fill="none" strokeWidth="4" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          className="stroke-emerald-500 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
        {done}/{total}
      </span>
    </span>
  );
}
