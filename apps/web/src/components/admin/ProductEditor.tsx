"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminProduct } from "@/lib/catalog";
import type { AdminCategoryRow } from "@/lib/catalog";
import { orderCategoriesByTree } from "@/lib/category-tree";
import type { CurrencyCode } from "@premier/protocol";

interface SpecRow {
  key: string;
  value: string;
}

interface VariantDraft {
  localId: string;
  id?: string;
  label: string;
  sku: string;
  price: string; // major units, e.g. "52999.00" — what the admin types
  stock: string;
  onSale: boolean;
  compareAt: string;
  images: string[];
  specs: SpecRow[];
  deleted?: boolean;
}

function specsToRows(attrs: Record<string, unknown>): SpecRow[] {
  return Object.entries(attrs).map(([key, value]) => ({ key, value: String(value) }));
}

function rowsToSpecs(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const key = r.key.trim();
    if (key) out[key] = r.value;
  }
  return out;
}

function newVariantDraft(): VariantDraft {
  return {
    localId: crypto.randomUUID(),
    label: "",
    sku: "",
    price: "",
    stock: "0",
    onSale: false,
    compareAt: "",
    images: [],
    specs: [],
  };
}

function variantsFromProduct(product: AdminProduct): VariantDraft[] {
  return product.variants.map((v) => ({
    localId: v.id,
    id: v.id,
    label: v.label ?? "",
    sku: v.sku ?? "",
    price: (v.priceCents / 100).toString(),
    stock: String(v.stock),
    onSale: v.compareAtCents != null,
    compareAt: v.compareAtCents != null ? (v.compareAtCents / 100).toString() : "",
    images: v.images,
    specs: specsToRows(v.attributes),
  }));
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600";
const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-zinc-500";

interface PickerCategory {
  id: string;
  name: string;
  parentId: string | null;
}

export function ProductEditor({
  mode,
  product,
  categories,
  currency,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  product?: AdminProduct;
  categories: AdminCategoryRow[];
  currency: CurrencyCode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [specs, setSpecs] = useState<SpecRow[]>(product ? specsToRows(product.attributes) : []);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    product ? variantsFromProduct(product) : [newVariantDraft()],
  );
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [categoryList, setCategoryList] = useState<PickerCategory[]>(categories);
  const orderedCategories = orderCategoriesByTree(categoryList);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);
  const selectedCategory = categoryList.find((c) => c.id === categoryId) ?? null;

  // A "brand" is just a category nested under whatever's currently selected
  // (Phones > Smartphones > Samsung) — same mechanism the Stage Manager's
  // category tree uses, surfaced here so an admin never has to leave the
  // product form to introduce a new brand.
  async function createBrand() {
    const name = newBrandName.trim();
    if (!name || !categoryId) return;
    setCreatingBrand(true);
    try {
      const res = await fetch("/api/v1/admin/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: categoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.category) throw new Error();
      toast.success(`"${name}" added under ${selectedCategory?.name}.`);
      setCategoryList((prev) => [
        ...prev,
        { id: data.category.id, name: data.category.name, parentId: data.category.parent_id },
      ]);
      setCategoryId(data.category.id);
      setNewBrandName("");
      setAddingBrand(false);
      router.refresh(); // keeps the Stage Manager's category list in sync too
    } catch {
      toast.error("Couldn't create that category.");
    } finally {
      setCreatingBrand(false);
    }
  }

  async function uploadFiles(files: FileList): Promise<string[]> {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/v1/admin/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error();
        urls.push(data.url);
      } catch {
        toast.error(`Couldn't upload "${file.name}".`);
      }
    }
    return urls;
  }

  async function handleProductImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingProduct(true);
    const urls = await uploadFiles(files);
    setImages((prev) => [...prev, ...urls]);
    setUploadingProduct(false);
  }

  function updateVariant(localId: string, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v) => (v.localId === localId ? { ...v, ...patch } : v)));
  }

  function removeVariant(localId: string) {
    setVariants((prev) =>
      prev
        .map((v) => (v.localId === localId ? { ...v, deleted: true } : v))
        .filter((v) => v.id || v.localId !== localId), // brand-new rows just vanish
    );
  }

  function addSpec(setter: (fn: (rows: SpecRow[]) => SpecRow[]) => void) {
    setter((rows) => [...rows, { key: "", value: "" }]);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Give the product a name first.");
      return;
    }
    const liveVariants = variants.filter((v) => !v.deleted);
    if (mode === "create" && liveVariants.length === 0) {
      toast.error("Add at least one variant.");
      return;
    }
    for (const v of liveVariants) {
      const priceNum = parseFloat(v.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        toast.error(`"${v.label || "A variant"}" needs a valid price.`);
        return;
      }
    }

    setSaving(true);
    try {
      const attributes = rowsToSpecs(specs);

      if (mode === "create") {
        const res = await fetch("/api/v1/admin/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: description || null,
            categoryId: categoryId || null,
            attributes,
            images,
            variants: liveVariants.map((v) => ({
              label: v.label || null,
              sku: v.sku || null,
              priceCents: Math.round(parseFloat(v.price) * 100),
              stock: parseInt(v.stock, 10) || 0,
              compareAtCents: v.onSale && v.compareAt ? Math.round(parseFloat(v.compareAt) * 100) : null,
              attributes: rowsToSpecs(v.specs),
              images: v.images,
            })),
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Product created.");
      } else {
        const deletedVariants = variants.filter((v) => v.deleted && v.id);
        const res = await fetch("/api/v1/admin/product", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product!.id,
            name,
            description: description || null,
            status,
            categoryId: categoryId || null,
            attributes,
            images,
            variants: [
              ...liveVariants.map((v) => ({
                id: v.id,
                label: v.label || null,
                sku: v.sku || null,
                priceCents: Math.round(parseFloat(v.price) * 100),
                stock: parseInt(v.stock, 10) || 0,
                compareAtCents: v.onSale && v.compareAt ? Math.round(parseFloat(v.compareAt) * 100) : null,
                attributes: rowsToSpecs(v.specs),
                images: v.images,
              })),
              ...deletedVariants.map((v) => ({ id: v.id, _delete: true })),
            ],
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Product saved.");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Couldn't save. Your edits are still here — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-zinc-200 bg-zinc-100 p-6 shadow-2xl transition-colors dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {mode === "create" ? "New product" : "Edit product"}
            </p>
            <h2 className="mt-1 text-base font-semibold">{mode === "create" ? "Add to the Vault" : name || "Untitled"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Samsung Galaxy A55 5G" />
          </label>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Category</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">— None —</option>
                {orderedCategories.map(({ category: c, depth }) => (
                  <option key={c.id} value={c.id}>
                    {depth > 0 ? `${"—".repeat(depth)} ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
              {categoryId ? (
                !addingBrand ? (
                  <button
                    type="button"
                    onClick={() => setAddingBrand(true)}
                    className="mt-1.5 text-[11px] font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    + New brand under &ldquo;{selectedCategory?.name}&rdquo;
                  </button>
                ) : (
                  <div className="mt-1.5 flex gap-1.5">
                    <input
                      autoFocus
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createBrand()}
                      placeholder="e.g. Samsung"
                      className={`${inputClass} py-1.5 text-xs`}
                    />
                    <button
                      type="button"
                      onClick={createBrand}
                      disabled={creatingBrand || !newBrandName.trim()}
                      className="shrink-0 rounded-lg bg-zinc-900 px-2.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
                    >
                      {creatingBrand ? "…" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingBrand(false);
                        setNewBrandName("");
                      }}
                      className="shrink-0 px-1 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      ×
                    </button>
                  </div>
                )
              ) : null}
            </label>
            {mode === "edit" ? (
              <label className="block">
                <span className={labelClass}>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            ) : null}
          </div>

          <div>
            <span className={labelClass}>Product images</span>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingProduct}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-400 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-600 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="text-[9px]">{uploadingProduct ? "…" : "Upload"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => handleProductImages(e.target.files)}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={labelClass}>Specs</span>
              <button type="button" onClick={() => addSpec(setSpecs)} className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-300">
                + Add spec
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={row.key}
                    onChange={(e) => setSpecs((prev) => prev.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))}
                    placeholder="e.g. display"
                    className={`${inputClass} w-1/3`}
                  />
                  <input
                    value={row.value}
                    onChange={(e) => setSpecs((prev) => prev.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
                    placeholder="e.g. 6.6&quot; Super AMOLED"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded-lg px-2 text-zinc-400 hover:bg-zinc-200 hover:text-red-500 dark:hover:bg-zinc-900"
                  >
                    ×
                  </button>
                </div>
              ))}
              {specs.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">No specs yet — brand, display, battery, etc.</p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className={labelClass}>Variations</span>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, newVariantDraft()])}
                className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-300"
              >
                + Add variant
              </button>
            </div>
            <div className="space-y-3">
              {variants
                .filter((v) => !v.deleted)
                .map((v) => (
                  <VariantEditor
                    key={v.localId}
                    variant={v}
                    currency={currency}
                    onChange={(patch) => updateVariant(v.localId, patch)}
                    onRemove={() => removeVariant(v.localId)}
                    onUpload={uploadFiles}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950"
          >
            {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function VariantEditor({
  variant,
  currency,
  onChange,
  onRemove,
  onUpload,
}: {
  variant: VariantDraft;
  currency: CurrencyCode;
  onChange: (patch: Partial<VariantDraft>) => void;
  onRemove: () => void;
  onUpload: (files: FileList) => Promise<string[]>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls = await onUpload(files);
    onChange({ images: [...variant.images, ...urls] });
    setUploading(false);
  }

  return (
    <div className="rounded-lg border border-zinc-300 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={variant.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Variant label (e.g. 128GB · Navy)"
          className={`${inputClass} flex-1 text-xs font-medium`}
        />
        <button type="button" onClick={onRemove} className="shrink-0 rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-500 dark:hover:bg-zinc-900">
          Remove
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input value={variant.sku} onChange={(e) => onChange({ sku: e.target.value })} placeholder="SKU" className={`${inputClass} text-xs`} />
        <input
          value={variant.price}
          onChange={(e) => onChange({ price: e.target.value })}
          placeholder={`Price (${currency})`}
          inputMode="decimal"
          className={`${inputClass} text-xs`}
        />
        <input value={variant.stock} onChange={(e) => onChange({ stock: e.target.value })} placeholder="Stock" inputMode="numeric" className={`${inputClass} text-xs`} />
      </div>

      <label className="mt-2 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={variant.onSale} onChange={(e) => onChange({ onSale: e.target.checked })} className="h-3.5 w-3.5" />
        On sale
      </label>
      {variant.onSale ? (
        <input
          value={variant.compareAt}
          onChange={(e) => onChange({ compareAt: e.target.value })}
          placeholder={`Compare-at price (${currency})`}
          inputMode="decimal"
          className={`${inputClass} mt-2 text-xs`}
        />
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {variant.images.map((url, i) => (
          <div key={url} className="group relative h-10 w-10 overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ images: variant.images.filter((_, idx) => idx !== i) })}
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-zinc-400 text-zinc-400 hover:border-zinc-600 hover:text-zinc-600 disabled:opacity-50 dark:border-zinc-700"
        >
          +
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
      </div>

      <VariantSpecs variant={variant} onChange={onChange} />
    </div>
  );
}

function VariantSpecs({ variant, onChange }: { variant: VariantDraft; onChange: (patch: Partial<VariantDraft>) => void }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          Variant specs (storage, color, ram…)
        </span>
        <button
          type="button"
          onClick={() => onChange({ specs: [...variant.specs, { key: "", value: "" }] })}
          className="text-[10px] font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          + Add
        </button>
      </div>
      <div className="space-y-1.5">
        {variant.specs.map((row, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={row.key}
              onChange={(e) =>
                onChange({ specs: variant.specs.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)) })
              }
              placeholder="key"
              className={`${inputClass} w-1/3 text-xs`}
            />
            <input
              value={row.value}
              onChange={(e) =>
                onChange({ specs: variant.specs.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)) })
              }
              placeholder="value"
              className={`${inputClass} text-xs`}
            />
            <button
              type="button"
              onClick={() => onChange({ specs: variant.specs.filter((_, idx) => idx !== i) })}
              className="shrink-0 rounded-lg px-1.5 text-zinc-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
