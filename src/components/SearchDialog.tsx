import { useEffect, useRef, useState } from "react";
import type { Page } from "@/lib/db";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  pages: Page[];
  onSelect: (id: string) => void;
}

export function SearchDialog({ open, onClose, pages, onSelect }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim()
    ? pages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      )
    : pages.slice(0, 10);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[selectedIndex]) {
        onSelect(results[selectedIndex].id);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex, onSelect, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page..."
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
          />
          <kbd className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Aucun résultat
            </div>
          ) : (
            results.map((page, i) => (
              <button
                key={page.id}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                  i === selectedIndex ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                onClick={() => { onSelect(page.id); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="w-5 text-center">{page.icon || "📄"}</span>
                <span className="truncate">{page.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
