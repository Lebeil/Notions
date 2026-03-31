import { useCallback, useEffect, useRef, useState } from "react";
import { db, type Page } from "./db";
import type { Block } from "@blocknote/core";
import { fullSync, pushToSupabase } from "./sync";

const SAVE_DEBOUNCE_MS = 500;
const SYNC_INTERVAL_MS = 30_000;

function generateId() {
  return crypto.randomUUID();
}

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    const all = await db.pages.orderBy("order").toArray();
    setPages(all);
    return all;
  }, []);

  useEffect(() => {
    async function init() {
      // Sync from Supabase first, then load local
      await fullSync().catch(() => {});
      let all = await reload();
      if (all.length === 0) {
        const id = generateId();
        const page: Page = {
          id,
          title: "Sans titre",
          content: JSON.stringify([{ type: "heading", props: { level: 1 }, content: [] }]),
          parentId: null,
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.pages.add(page);
        all = [page];
        setPages(all);
      }
      setActivePageId(all[0].id);
      setLoading(false);
    }
    init();
  }, [reload]);

  // Periodic background sync
  useEffect(() => {
    const interval = setInterval(() => {
      pushToSupabase().catch(() => {});
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) ?? null;

  const initialContent = activePage?.content
    ? (() => {
        try {
          const parsed = JSON.parse(activePage.content);
          return parsed.length > 0 ? parsed : undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const save = useCallback(
    (blocks: Block<any, any, any>[]) => {
      if (!activePageId) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const content = JSON.stringify(blocks);
        const title = extractTitle(blocks);
        await db.pages.update(activePageId, {
          content,
          title,
          updatedAt: Date.now(),
        });
        reload();
        pushToSupabase().catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    },
    [activePageId, reload]
  );

  const createPage = useCallback(
    async (parentId: string | null = null) => {
      const siblings = pages.filter((p) => p.parentId === parentId);
      const id = generateId();
      const page: Page = {
        id,
        title: "Sans titre",
        content: JSON.stringify([{ type: "heading", props: { level: 1 }, content: [] }]),
        parentId,
        order: siblings.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.pages.add(page);
      await reload();
      setActivePageId(id);
      pushToSupabase().catch(() => {});
      return id;
    },
    [pages, reload]
  );

  const deletePage = useCallback(
    async (id: string) => {
      // Delete page and all its children recursively
      const toDelete = [id];
      const findChildren = (parentId: string) => {
        pages
          .filter((p) => p.parentId === parentId)
          .forEach((child) => {
            toDelete.push(child.id);
            findChildren(child.id);
          });
      };
      findChildren(id);
      await db.pages.bulkDelete(toDelete);
      const remaining = await reload();
      if (toDelete.includes(activePageId ?? "")) {
        setActivePageId(remaining[0]?.id ?? null);
      }
      // Delete from Supabase too
      import("./supabase").then(({ supabase }) => {
        supabase.from("pages").delete().in("id", toDelete).then(() => {});
      });
    },
    [pages, activePageId, reload]
  );

  const getAncestors = useCallback(
    (pageId: string): Page[] => {
      const ancestors: Page[] = [];
      let current = pages.find((p) => p.id === pageId);
      while (current?.parentId) {
        const parent = pages.find((p) => p.id === current!.parentId);
        if (parent) {
          ancestors.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
      return ancestors;
    },
    [pages]
  );

  return {
    pages,
    activePage,
    activePageId,
    initialContent,
    loading,
    save,
    setActivePageId,
    createPage,
    deletePage,
    getAncestors,
  };
}

function extractTitle(blocks: Block<any, any, any>[]): string {
  if (!blocks.length) return "Sans titre";
  const first = blocks[0];
  if (first.content && Array.isArray(first.content) && first.content.length > 0) {
    const text = first.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    return text || "Sans titre";
  }
  return "Sans titre";
}
