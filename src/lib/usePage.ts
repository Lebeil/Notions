import { useCallback, useEffect, useRef, useState } from "react";
import { db, type Page } from "./db";
import type { Block } from "@blocknote/core";

const DEFAULT_PAGE_ID = "default";
const SAVE_DEBOUNCE_MS = 500;

export function usePage() {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      let existing = await db.pages.get(DEFAULT_PAGE_ID);
      if (!existing) {
        existing = {
          id: DEFAULT_PAGE_ID,
          title: "Sans titre",
          content: "[]",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.pages.add(existing);
      }
      setPage(existing);
      setLoading(false);
    }
    load();
  }, []);

  const save = useCallback((blocks: Block<any, any, any>[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const content = JSON.stringify(blocks);
      await db.pages.update(DEFAULT_PAGE_ID, {
        content,
        updatedAt: Date.now(),
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const initialContent = page?.content
    ? (() => {
        try {
          const parsed = JSON.parse(page.content);
          return parsed.length > 0 ? parsed : undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  return { loading, initialContent, save };
}
