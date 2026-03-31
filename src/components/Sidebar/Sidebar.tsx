import type { Page } from "@/lib/db";
import { PageTree } from "./PageTree";
import { useState } from "react";

interface SidebarProps {
  pages: Page[];
  favoritePages: Page[];
  trashedPages: Page[];
  activePageId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onToggleFavorite: (id: string) => void;
  onReorder: (pageId: string, newParentId: string | null, newIndex: number) => void;
  onOpenSearch: () => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Sidebar({
  pages,
  favoritePages,
  trashedPages,
  activePageId,
  collapsed,
  onToggle,
  onSelect,
  onCreate,
  onDelete,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onToggleFavorite,
  onReorder,
  onOpenSearch,
  userEmail,
  onSignOut,
}: SidebarProps) {
  const [trashOpen, setTrashOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (window.innerWidth < 768) onToggle();
  };

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-200 z-20 flex flex-col w-64 md:w-60 ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notions</span>
          <button
            onClick={onToggle}
            className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Search button */}
        <button
          onClick={onOpenSearch}
          className="mx-2 mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Rechercher
          <kbd className="hidden sm:inline ml-auto text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-1 rounded">K</kbd>
        </button>

        {/* Favorites */}
        {favoritePages.length > 0 && (
          <div className="px-1 mt-2">
            <div className="px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Favoris
            </div>
            {favoritePages.map((page) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page.id)}
                className={`w-full text-left flex items-center gap-2 rounded-md px-3 py-1.5 md:py-1 text-sm transition-colors ${
                  page.id === activePageId
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="w-5 text-center text-xs">{page.icon || "📄"}</span>
                <span className="truncate">{page.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Pages tree */}
        <div className="flex-1 overflow-y-auto py-2 px-1 overscroll-contain">
          <div className="px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Pages
          </div>
          <PageTree
            pages={pages}
            activePageId={activePageId}
            onSelect={handleSelect}
            onCreate={onCreate}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onReorder={onReorder}
          />
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 space-y-1">
          {/* Trash toggle */}
          <button
            onClick={() => setTrashOpen(!trashOpen)}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 md:py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Corbeille
            {trashedPages.length > 0 && (
              <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full px-1.5">
                {trashedPages.length}
              </span>
            )}
          </button>

          {/* Trash content */}
          {trashOpen && trashedPages.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
              {trashedPages.map((page) => (
                <div key={page.id} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="truncate flex-1">{page.icon || "📄"} {page.title}</span>
                  <button
                    onClick={() => onRestore(page.id)}
                    className="px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-500"
                  >
                    Restaurer
                  </button>
                  <button
                    onClick={() => onPermanentDelete(page.id)}
                    className="px-1.5 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={onEmptyTrash}
                className="w-full text-xs text-red-500 hover:text-red-600 py-1"
              >
                Vider la corbeille
              </button>
            </div>
          )}

          {/* New page */}
          <button
            onClick={() => onCreate(null)}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 md:py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle page
          </button>

          {/* User */}
          {userEmail && (
            <div className="flex items-center justify-between px-3 py-2 md:py-1.5">
              <span className="text-xs text-gray-400 truncate">{userEmail}</span>
              {onSignOut && (
                <button onClick={onSignOut} className="text-xs text-gray-400 hover:text-gray-600 ml-2">
                  Quitter
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
