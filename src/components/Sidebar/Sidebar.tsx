import type { Page } from "@/lib/db";
import { PageTree } from "./PageTree";

interface SidebarProps {
  pages: Page[];
  activePageId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Sidebar({
  pages,
  activePageId,
  collapsed,
  onToggle,
  onSelect,
  onCreate,
  onDelete,
  userEmail,
  onSignOut,
}: SidebarProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    // Auto-close sidebar on mobile after selecting a page
    if (window.innerWidth < 768) onToggle();
  };

  return (
    <>
      {/* Overlay backdrop on mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-50 border-r border-gray-200 transition-transform duration-200 z-20 flex flex-col w-64 md:w-60 ${
          collapsed
            ? "-translate-x-full md:-translate-x-full"
            : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Notions</span>
          <button
            onClick={onToggle}
            className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            title="Replier la sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-1 overscroll-contain">
          <PageTree
            pages={pages}
            activePageId={activePageId}
            onSelect={handleSelect}
            onCreate={onCreate}
            onDelete={onDelete}
          />
        </div>

        <div className="border-t border-gray-200 p-2 space-y-1">
          <button
            onClick={() => onCreate(null)}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 md:py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle page
          </button>
          {userEmail && (
            <div className="flex items-center justify-between px-3 py-2 md:py-1.5">
              <span className="text-xs text-gray-400 truncate">{userEmail}</span>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2"
                >
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
