import { useState } from "react";
import type { Page } from "@/lib/db";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageTreeProps {
  pages: Page[];
  activePageId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onReorder: (pageId: string, newParentId: string | null, newIndex: number) => void;
}

export function PageTree({
  pages,
  activePageId,
  onSelect,
  onCreate,
  onDelete,
  onToggleFavorite,
  onReorder,
}: PageTreeProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedPage = pages.find((p) => p.id === draggedId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Flatten the tree for DnD — all visible pages in order
  const flatList = flattenTree(pages, null, 0);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = flatList.find((f) => f.page.id === active.id);
    const overItem = flatList.find((f) => f.page.id === over.id);
    if (!activeItem || !overItem) return;

    // Move to same parent as the target, at its position
    const newParentId = overItem.page.parentId;
    const siblings = pages
      .filter((p) => p.parentId === newParentId && p.id !== active.id)
      .sort((a, b) => a.order - b.order);
    const overIndex = siblings.findIndex((p) => p.id === over.id);
    const newIndex = overIndex === -1 ? siblings.length : overIndex;

    onReorder(active.id as string, newParentId, newIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={flatList.map((f) => f.page.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-0.5">
          {pages
            .filter((p) => p.parentId === null)
            .sort((a, b) => a.order - b.order)
            .map((page) => (
              <SortablePageItem
                key={page.id}
                page={page}
                pages={pages}
                depth={0}
                activePageId={activePageId}
                onSelect={onSelect}
                onCreate={onCreate}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                isDragging={draggedId === page.id}
              />
            ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {draggedPage ? (
          <div className="rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm flex items-center gap-2 opacity-90">
            <span className="text-xs">{draggedPage.icon || "📄"}</span>
            <span className="truncate">{draggedPage.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface FlatItem {
  page: Page;
  depth: number;
}

function flattenTree(pages: Page[], parentId: string | null, depth: number): FlatItem[] {
  const children = pages
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  const result: FlatItem[] = [];
  for (const child of children) {
    result.push({ page: child, depth });
    result.push(...flattenTree(pages, child.id, depth + 1));
  }
  return result;
}

interface SortablePageItemProps {
  page: Page;
  pages: Page[];
  depth: number;
  activePageId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isDragging: boolean;
}

function SortablePageItem({
  page,
  pages,
  depth,
  activePageId,
  onSelect,
  onCreate,
  onDelete,
  onToggleFavorite,
  isDragging,
}: SortablePageItemProps) {
  const [expanded, setExpanded] = useState(true);
  const children = pages
    .filter((p) => p.parentId === page.id)
    .sort((a, b) => a.order - b.order);
  const isActive = page.id === activePageId;
  const hasChildren = children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-2.5 md:py-1.5 text-sm cursor-pointer transition-colors ${
          isActive
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(page.id)}
      >
        {/* Drag handle */}
        <button
          className="flex-shrink-0 w-4 h-7 md:h-4 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>

        {/* Expand toggle */}
        <button
          className={`flex-shrink-0 w-7 h-7 md:w-4 md:h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 ${
            hasChildren ? "visible" : "invisible"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="w-5 text-center text-xs flex-shrink-0">{page.icon || "📄"}</span>
        <span className="flex-1 truncate">{page.title}</span>

        <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(page.id); }}
            title={page.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {page.favorite ? (
              <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
          <button
            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
            onClick={(e) => { e.stopPropagation(); onCreate(page.id); }}
            title="Sous-page"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="w-8 h-8 md:w-5 md:h-5 flex items-center justify-center rounded text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 active:bg-red-200"
            onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
            title="Supprimer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <SortablePageItem
              key={child.id}
              page={child}
              pages={pages}
              depth={depth + 1}
              activePageId={activePageId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              isDragging={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
