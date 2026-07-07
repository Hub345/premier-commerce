"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface LivePreviewHandle {
  refresh: () => void;
}

// Reflects the REAL saved state — since the Theme Lab auto-saves, there's no
// unsaved-draft state to fake here. Refreshing after each successful save is
// simpler and more honest than piping unsaved edits across the iframe boundary.
export const LivePreviewFrame = forwardRef<LivePreviewHandle, { path?: string }>(
  function LivePreviewFrame({ path = "/" }, ref) {
    const [bust, setBust] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      refresh: () => setBust((v) => v + 1),
    }));

    return (
      <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-2 font-mono text-[11px] text-zinc-500">Live Preview — {path}</span>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl bg-white">
          <iframe
            ref={iframeRef}
            key={bust}
            src={path}
            title="Storefront live preview"
            className="h-full w-full origin-top-left"
            style={{ border: "none" }}
          />
        </div>
      </div>
    );
  },
);
