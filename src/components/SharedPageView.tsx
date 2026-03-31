import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BlockEditor } from "@/components/Editor/BlockEditor";
import { useCollaboration } from "@/lib/useCollaboration";
import type { Block } from "@blocknote/core";

interface SharedPageViewProps {
  shareToken: string;
}

interface SharedPage {
  id: string;
  title: string;
  content: string;
}

export function SharedPageView({ shareToken }: SharedPageViewProps) {
  const [page, setPage] = useState<SharedPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guestName = `Invité ${Math.floor(Math.random() * 1000)}`;
  const collab = useCollaboration(page?.id ?? null, guestName);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("pages")
        .select("id, title, content")
        .eq("share_token", shareToken)
        .single();

      if (err || !data) {
        setError("Cette page n'existe pas ou le lien de partage est invalide.");
      } else {
        setPage(data);
      }
      setLoading(false);
    }
    load();
  }, [shareToken]);

  const handleSave = async (blocks: Block<any, any, any>[]) => {
    if (!page) return;
    const content = JSON.stringify(blocks);
    const title =
      blocks[0]?.content && Array.isArray(blocks[0].content)
        ? blocks[0].content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("") || page.title
        : page.title;

    await supabase
      .from("pages")
      .update({ content, title, updated_at: new Date().toISOString() })
      .eq("id", page.id);
  };

  // Apply dark mode
  useEffect(() => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-gray-950">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-gray-950">
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <a
            href="/"
            className="inline-block text-sm text-gray-900 dark:text-white underline"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  const initialContent = (() => {
    try {
      const parsed = JSON.parse(page.content);
      return parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 dark:text-gray-100">
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page partagée — {guestName}
        </span>
        <a
          href="/"
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Ouvrir Notions
        </a>
      </div>
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
        <BlockEditor
          key={page.id}
          initialContent={initialContent}
          onSave={handleSave}
          collaboration={
            collab
              ? {
                  fragment: collab.fragment,
                  provider: collab.provider,
                  user: {
                    name: guestName,
                    color:
                      collab.provider.awareness.getLocalState()?.user?.color ??
                      "#61AFEF",
                  },
                }
              : undefined
          }
        />
      </main>
    </div>
  );
}
