"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Business, BusinessBenefit, FontChoice } from "@premier/protocol";
import type { AdminCategoryRow } from "@/lib/catalog";
import { orderCategoriesByTree } from "@/lib/category-tree";
import { LivePreviewFrame, type LivePreviewHandle } from "@/components/admin/LivePreviewFrame";

type SyncState = "idle" | "saving" | "synced" | "error";

function SyncBadge({ state }: { state: SyncState }) {
  const map: Record<SyncState, { label: string; dot: string }> = {
    idle: { label: "Idle", dot: "bg-zinc-600" },
    saving: { label: "Saving…", dot: "bg-amber-400 animate-pulse" },
    synced: { label: "Synced", dot: "bg-emerald-400" },
    error: { label: "Sync error", dot: "bg-red-500" },
  };
  const s = map[state];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";

const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
  { value: "geist", label: "Geist" },
  { value: "inter", label: "Inter" },
  { value: "playfair", label: "Playfair Display" },
];

export function ThemeLab({
  business,
  categories,
}: {
  business: Business;
  categories: AdminCategoryRow[];
}) {
  const [accent, setAccent] = useState(business.branding.accent ?? "#D8A24A");
  const [primary, setPrimary] = useState(business.branding.primary ?? "#161613");
  const [fontFamily, setFontFamily] = useState<FontChoice>(business.branding.fontFamily ?? "geist");
  const [tagline, setTagline] = useState(business.branding.tagline ?? "");
  const [heroHeadline, setHeroHeadline] = useState(business.branding.heroHeadline ?? "");
  const [heroSubcopy, setHeroSubcopy] = useState(business.branding.heroSubcopy ?? "");
  const [facebookUrl, setFacebookUrl] = useState(business.contact.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(business.contact.instagramUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(business.contact.youtubeUrl ?? "");
  const [xUrl, setXUrl] = useState(business.contact.xUrl ?? "");
  const [benefits, setBenefits] = useState<BusinessBenefit[]>(business.benefits);

  const [sync, setSync] = useState<SyncState>("idle");
  const previewRef = useRef<LivePreviewHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSync("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/admin/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accent,
            primary,
            fontFamily,
            tagline,
            heroHeadline,
            heroSubcopy,
            facebookUrl,
            instagramUrl,
            youtubeUrl,
            xUrl,
            benefits,
          }),
        });
        if (!res.ok) {
          setSync("error");
          return;
        }
        setSync("synced");
        previewRef.current?.refresh();
      } catch {
        setSync("error");
        toast.error("Couldn't reach the server. Your last change wasn't saved.");
      }
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accent, primary, fontFamily, tagline, heroHeadline, heroSubcopy, facebookUrl, instagramUrl, youtubeUrl, xUrl, benefits]);

  function updateBenefit(i: number, patch: Partial<BusinessBenefit>) {
    setBenefits((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/v1/admin/reset", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => null);
      void data;
      window.location.reload();
    } catch {
      toast.error("Restore failed. Please try again.");
      setResetting(false);
      setConfirmReset(false);
    }
  }

  return (
    <div className="grid h-screen grid-cols-1 gap-6 p-6 lg:grid-cols-[26rem_1fr]">
      <div className="flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              Archetype 02
            </p>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Stage Manager</h1>
          </div>
          <SyncBadge state={sync} />
        </div>

        <Section title="Color Lab">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Accent">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                />
                <input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </Field>
            <Field label="Primary">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                />
                <input
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Typography">
          <Field label="Font family">
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as FontChoice)}
              className={inputClass}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Wording">
          <div className="space-y-3">
            <Field label="Hero Headline">
              <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Hero Subtext">
              <textarea
                value={heroSubcopy}
                onChange={(e) => setHeroSubcopy(e.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>
            <Field label="Tagline">
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section title="The Bizrah Promise">
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 p-3">
                <input
                  value={b.title}
                  onChange={(e) => updateBenefit(i, { title: e.target.value })}
                  className={`${inputClass} mb-2 font-medium`}
                  placeholder="Title"
                />
                <textarea
                  value={b.copy}
                  onChange={(e) => updateBenefit(i, { copy: e.target.value })}
                  rows={2}
                  className={`${inputClass} text-xs`}
                  placeholder="Copy"
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Social Connections">
          <div className="space-y-3">
            <Field label="Facebook">
              <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Instagram">
              <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass} />
            </Field>
            <Field label="YouTube">
              <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className={inputClass} />
            </Field>
            <Field label="X">
              <input value={xUrl} onChange={(e) => setXUrl(e.target.value)} className={inputClass} />
            </Field>
          </div>
        </Section>

        {categories.length > 0 ? <CategoryStageEditor categories={categories} previewRef={previewRef} /> : null}

        <Section title="System">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-950/50"
            >
              Restore Stage to Factory Defaults
            </button>
          ) : (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4">
              <p className="text-sm text-red-300">
                This overwrites colors, fonts, hero copy, and the Bizrah Promise
                cards with the original defaults. This can't be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {resetting ? "Restoring…" : "Yes, restore defaults"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="h-full">
        <LivePreviewFrame ref={previewRef} path="/" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

function CategoryStageEditor({
  categories,
  previewRef,
}: {
  categories: AdminCategoryRow[];
  previewRef: RefObject<LivePreviewHandle | null>;
}) {
  const router = useRouter();
  const ordered = orderCategoriesByTree(categories);
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");
  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];

  const [kicker, setKicker] = useState(selected?.heroKicker ?? "");
  const [headline, setHeadline] = useState(selected?.heroHeadline ?? "");
  const [bg, setBg] = useState(selected?.heroBg ?? "");
  const skipFirst = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sync, setSync] = useState<SyncState>("idle");

  const [addingChild, setAddingChild] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function selectCategory(id: string) {
    const c = categories.find((cat) => cat.id === id);
    setSelectedId(id);
    setKicker(c?.heroKicker ?? "");
    setHeadline(c?.heroHeadline ?? "");
    setBg(c?.heroBg ?? "");
    setAddingChild(false);
    setConfirmDelete(false);
    skipFirst.current = true; // loading a category's values isn't a user edit
  }

  async function createChild() {
    const name = newName.trim();
    if (!name || !selected) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: selected.id }),
      });
      if (!res.ok) throw new Error();
      toast.success(`"${name}" added under ${selected.name}.`);
      setNewName("");
      setAddingChild(false);
      router.refresh();
    } catch {
      toast.error("Couldn't create that category.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/v1/admin/category", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: selected.id }),
      });
      if (!res.ok) throw new Error();
      toast.success(`"${selected.name}" removed.`);
      setSelectedId(categories[0]?.id ?? "");
      router.refresh();
    } catch {
      toast.error("Couldn't remove that category.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSync("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/admin/category", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId: selectedId, heroKicker: kicker, heroHeadline: headline, heroBg: bg }),
        });
        if (!res.ok) {
          setSync("error");
          return;
        }
        setSync("synced");
        previewRef.current?.refresh();
      } catch {
        setSync("error");
      }
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kicker, headline, bg]);

  return (
    <Section title="Categories">
      <div className="mb-3 flex items-center justify-between gap-2">
        <select
          value={selectedId}
          onChange={(e) => selectCategory(e.target.value)}
          className={`${inputClass} flex-1`}
        >
          {ordered.map(({ category: c, depth }) => (
            <option key={c.id} value={c.id}>
              {depth > 0 ? `${"—".repeat(depth)} ` : ""}
              {c.name}
            </option>
          ))}
        </select>
        <SyncBadge state={sync} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {!addingChild ? (
          <button
            type="button"
            onClick={() => setAddingChild(true)}
            disabled={!selected}
            className="flex-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-50"
          >
            + Add subcategory under &ldquo;{selected?.name ?? "…"}&rdquo;
          </button>
        ) : (
          <div className="flex flex-1 gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChild()}
              placeholder={`e.g. Samsung (under ${selected?.name})`}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={createChild}
              disabled={creating || !newName.trim()}
              className="shrink-0 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-950 disabled:opacity-50"
            >
              {creating ? "…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingChild(false);
                setNewName("");
              }}
              className="shrink-0 rounded-lg px-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Field label="Kicker">
          <input value={kicker} onChange={(e) => setKicker(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Headline">
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Background gradient (CSS)">
          <input value={bg} onChange={(e) => setBg(e.target.value)} className={`${inputClass} font-mono text-xs`} />
        </Field>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={!selected}
            className="text-xs font-medium text-red-400/80 hover:text-red-400 disabled:opacity-50"
          >
            Delete &ldquo;{selected?.name ?? "…"}&rdquo;
          </button>
        ) : (
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3">
            <p className="text-xs text-red-300">
              Removes &ldquo;{selected?.name}&rdquo; and any subcategories/brands under it. Products in it
              become uncategorized rather than being deleted.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={deleteSelected}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
