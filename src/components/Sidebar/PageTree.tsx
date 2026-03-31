import { useState } from "react";
import type { Page } from "@/lib/db";

interface PageTreeProps {
  pages: Page[];
  activePageId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}

export function PageTree({
  pages,
  activePageId,
  onSelect,
  onCreate,
  onDelete,
}: PageTreeProps) {
  const rootPages = pages.filter((p) => p.parentId === null);

  return (
    <div className="flex flex-col gap-0.5">
      {rootPages.map((page) => (
        <PageItem
          key={page.id}
          page={page}
          pages={pages}
          depth={0}
          activePageId={activePageId}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface PageItemProps {
  page: Page;
  pages: Page[];
  depth: number;
  activePageId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}

function PageItem({
  page,
  pages,
  depth,
  activePageId,
  onSelect,
  onCreate,
  onDelete,
}: PageItemProps) {
  const [expanded, setExpanded] = useState(true);
  const children = pages.filter((p) => p.parentId === page.id);
  const isActive = page.id === activePageId;
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer transition-colors ${
          isActive
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(page.id)}
      >
        <button
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 ${
            hasChildren ? "visible" : "invisible"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="flex-1 truncate">{page.title}</span>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onCreate(page.id);
            }}
            title="Ajouter une sous-page"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(page.id);
            }}
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
            <PageItem
              key={child.id}
              page={child}
              pages={pages}
              depth={depth + 1}
              activePageId={activePageId}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
