"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { EditPayload } from "@/components/site/ZenithEditable";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";

// Listens for postMessage("edit") from the storefront rendered inside the
// live-preview iframe (ZenithEditable's pencil buttons), and applies changes
// through the SAME API routes the sidebar forms already use — this is a new
// entry point onto existing infrastructure, not a new data model.
export function EditHud({ onSaved }: { onSaved: () => void }) {
  const [edit, setEdit] = useState<EditPayload | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as Partial<EditPayload> | undefined;
      if (data?.source !== "zenith-storefront" || data.type !== "edit") return;
      setEdit(data as EditPayload);
      setValue(data.value ?? "");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function apply(overrideValue?: string) {
    if (!edit) return;
    const finalValue = overrideValue ?? value;
    setSaving(true);
    try {
      const res =
        edit.scope === "business"
          ? await fetch("/api/v1/admin/theme", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ [edit.field]: finalValue }),
            })
          : await fetch("/api/v1/admin/category", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ categoryId: edit.meta?.categoryId, [edit.field]: finalValue }),
            });
      if (!res.ok) throw new Error();
      toast.success(`${edit.label} updated.`);
      setEdit(null);
      onSaved();
    } catch {
      toast.error(`Couldn't save ${edit.label}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file || !edit) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      await apply(data.url);
    } catch {
      toast.error("Upload failed.");
      setSaving(false);
    }
  }

  if (!edit) return null;

  return (
    <div className="absolute right-4 top-4 z-40 w-72 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur transition-colors dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Editing
        </span>
        <button
          type="button"
          onClick={() => setEdit(null)}
          aria-label="Close"
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{edit.label}</p>

      {edit.kind === "image" ? (
        <div>
          {edit.value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={edit.value} alt="" className="mb-2 h-20 w-full rounded-lg object-cover" />
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="w-full rounded-lg border border-dashed border-zinc-400 py-3 text-xs text-zinc-500 hover:border-zinc-600 disabled:opacity-50 dark:border-zinc-700"
          >
            {saving ? "Uploading…" : "Upload image"}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => handleImageUpload(e.target.files)} />
        </div>
      ) : edit.kind === "textarea" || edit.kind === "gradient" ? (
        <textarea
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          rows={edit.kind === "gradient" ? 2 : 4}
          className={`${inputClass} font-mono text-xs`}
          placeholder={edit.kind === "gradient" ? "linear-gradient(...)" : undefined}
        />
      ) : (
        <input value={value} onChange={(ev) => setValue(ev.target.value)} className={inputClass} autoFocus />
      )}

      {edit.kind !== "image" ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => apply()}
            disabled={saving}
            className="flex-1 rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={() => setEdit(null)}
            className="rounded-lg border border-zinc-300 px-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
