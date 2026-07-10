"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { AdminCategoryRow } from "@/lib/catalog";

// True drag-with-the-mouse reordering ON the live preview (a different
// document, inside an iframe) isn't something native/dnd-kit drag targets
// support across a frame boundary — so this lives here, in the sidebar,
// instead. Dropping still updates featured_rank instantly and refreshes the
// preview, which is what actually matters: the Grand Gallery's order changes.
export function FeaturedReorder({
  categories,
  onSaved,
}: {
  categories: AdminCategoryRow[];
  onSaved: () => void;
}) {
  const [items, setItems] = useState(() =>
    categories
      .filter((c) => c.isFeatured)
      .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0)),
  );
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setItems(
      categories.filter((c) => c.isFeatured).sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0)),
    );
  }, [categories]);

  if (items.length === 0) return null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setSaving(true);

    try {
      const results = await Promise.all(
        reordered.map((c, i) =>
          fetch("/api/v1/admin/category", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: c.id, featuredRank: i }),
          }),
        ),
      );
      if (results.some((r) => !r.ok)) throw new Error();
      onSaved();
    } catch {
      toast.error("Couldn't save the new order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        Drag to reorder the Grand Gallery
        {saving ? <span className="font-mono text-[10px] uppercase text-amber-500">saving…</span> : null}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5">
            {items.map((c) => (
              <SortableRow key={c.id} category={c} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableRow({ category }: { category: AdminCategoryRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-zinc-500 active:cursor-grabbing">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </span>
      <span className="text-zinc-100">{category.name}</span>
    </li>
  );
}
