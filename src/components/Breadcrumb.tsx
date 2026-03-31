import type { Page } from "@/lib/db";

interface BreadcrumbProps {
  ancestors: Page[];
  currentPage: Page | null;
  onNavigate: (id: string) => void;
}

export function Breadcrumb({ ancestors, currentPage, onNavigate }: BreadcrumbProps) {
  if (!currentPage || ancestors.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-400 mb-4">
      {ancestors.map((page) => (
        <span key={page.id} className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(page.id)}
            className="hover:text-gray-600 transition-colors truncate max-w-32"
          >
            {page.title}
          </button>
          <span>/</span>
        </span>
      ))}
      <span className="text-gray-600 truncate">{currentPage.title}</span>
    </nav>
  );
}
