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
          icon: "",
          favorite: false,
          deleted: false,
          shareToken: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.pages.add(page);
        all = [page];
        setPages(all);
      }
      setActivePageId(all.filter((p) => !p.deleted)[0]?.id ?? null);
      setLoading(false);
    }
    init();
  }, [reload]);

  useEffect(() => {
    const interval = setInterval(() => {
      pushToSupabase().catch(() => {});
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Filter out deleted pages for normal display
  const activePages = pages.filter((p) => !p.deleted);
  const trashedPages = pages.filter((p) => p.deleted);
  const favoritePages = activePages.filter((p) => p.favorite);

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
      const siblings = pages.filter((p) => p.parentId === parentId && !p.deleted);
      const id = generateId();
      const page: Page = {
        id,
        title: "Sans titre",
        content: JSON.stringify([{ type: "heading", props: { level: 1 }, content: [] }]),
        parentId,
        order: siblings.length,
        icon: "",
        favorite: false,
        deleted: false,
        shareToken: null,
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

  // Soft delete — move to trash
  const deletePage = useCallback(
    async (id: string) => {
      const toTrash = [id];
      const findChildren = (parentId: string) => {
        pages
          .filter((p) => p.parentId === parentId)
          .forEach((child) => {
            toTrash.push(child.id);
            findChildren(child.id);
          });
      };
      findChildren(id);
      for (const tid of toTrash) {
        await db.pages.update(tid, { deleted: true, updatedAt: Date.now() });
      }
      const remaining = await reload();
      const active = remaining.filter((p) => !p.deleted);
      if (toTrash.includes(activePageId ?? "")) {
        setActivePageId(active[0]?.id ?? null);
      }
      pushToSupabase().catch(() => {});
    },
    [pages, activePageId, reload]
  );

  // Restore from trash
  const restorePage = useCallback(
    async (id: string) => {
      await db.pages.update(id, { deleted: false, parentId: null, updatedAt: Date.now() });
      await reload();
      pushToSupabase().catch(() => {});
    },
    [reload]
  );

  // Permanently delete
  const permanentDelete = useCallback(
    async (id: string) => {
      await db.pages.delete(id);
      await reload();
      import("./supabase").then(({ supabase }) => {
        supabase.from("pages").delete().eq("id", id).then(() => {});
      });
    },
    [reload]
  );

  // Empty trash
  const emptyTrash = useCallback(async () => {
    const ids = trashedPages.map((p) => p.id);
    await db.pages.bulkDelete(ids);
    await reload();
    import("./supabase").then(({ supabase }) => {
      supabase.from("pages").delete().in("id", ids).then(() => {});
    });
  }, [trashedPages, reload]);

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (id: string) => {
      const page = pages.find((p) => p.id === id);
      if (!page) return;
      await db.pages.update(id, { favorite: !page.favorite, updatedAt: Date.now() });
      await reload();
      pushToSupabase().catch(() => {});
    },
    [pages, reload]
  );

  // Set page icon
  const setPageIcon = useCallback(
    async (id: string, icon: string) => {
      await db.pages.update(id, { icon, updatedAt: Date.now() });
      await reload();
      pushToSupabase().catch(() => {});
    },
    [reload]
  );

  // Enable sharing — generate token and push to Supabase
  const enableShare = useCallback(
    async (id: string): Promise<string> => {
      const token = crypto.randomUUID();
      await db.pages.update(id, { shareToken: token, updatedAt: Date.now() });
      // Push to Supabase immediately so the share link works
      const { supabase } = await import("./supabase");
      await supabase.from("pages").update({ share_token: token }).eq("id", id);
      await reload();
      return token;
    },
    [reload]
  );

  // Disable sharing
  const disableShare = useCallback(
    async (id: string) => {
      await db.pages.update(id, { shareToken: null, updatedAt: Date.now() });
      const { supabase } = await import("./supabase");
      await supabase.from("pages").update({ share_token: null }).eq("id", id);
      await reload();
    },
    [reload]
  );

  // Reorder page (drag-and-drop)
  const reorderPage = useCallback(
    async (pageId: string, newParentId: string | null, newIndex: number) => {
      // Get siblings at the target location (excluding the moved page)
      const allPages = await db.pages.orderBy("order").toArray();
      const siblings = allPages
        .filter((p) => p.parentId === newParentId && p.id !== pageId && !p.deleted)
        .sort((a, b) => a.order - b.order);

      // Insert at newIndex
      siblings.splice(newIndex, 0, allPages.find((p) => p.id === pageId)!);

      // Update order for all siblings + move the page
      for (let i = 0; i < siblings.length; i++) {
        const updates: Partial<Page> = { order: i, updatedAt: Date.now() };
        if (siblings[i].id === pageId) {
          updates.parentId = newParentId;
        }
        await db.pages.update(siblings[i].id, updates);
      }
      await reload();
      pushToSupabase().catch(() => {});
    },
    [reload]
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
    pages: activePages,
    trashedPages,
    favoritePages,
    activePage,
    activePageId,
    initialContent,
    loading,
    save,
    setActivePageId,
    createPage,
    deletePage,
    restorePage,
    permanentDelete,
    emptyTrash,
    toggleFavorite,
    setPageIcon,
    reorderPage,
    enableShare,
    disableShare,
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
