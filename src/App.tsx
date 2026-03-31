import { useCallback, useEffect, useState } from "react";
import { BlockEditor } from "@/components/Editor/BlockEditor";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthPage } from "@/components/Auth/AuthPage";
import { SearchDialog } from "@/components/SearchDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { usePages } from "@/lib/usePages";
import { useAuth } from "@/lib/useAuth";
import { useCollaboration } from "@/lib/useCollaboration";
import { SharedPageView } from "@/components/SharedPageView";

export function App() {
  // Check if we're viewing a shared page
  const shareToken = new URLSearchParams(window.location.search).get("share");
  if (shareToken) {
    return <SharedPageView shareToken={shareToken} />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-gray-950">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  }

  return <AppContent user={user} onSignOut={signOut} userName={user.email ?? "Anonyme"} />;
}

function AppContent({
  user,
  onSignOut,
  userName,
}: {
  user: { email?: string };
  onSignOut: () => void;
  userName: string;
}) {
  const {
    pages,
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
    reorderPage,
    enableShare,
    disableShare,
    getAncestors,
  } = usePages();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("notions-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const collab = useCollaboration(activePageId, userName);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("notions-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchSelect = useCallback(
    (id: string) => {
      setActivePageId(id);
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    },
    [setActivePageId]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-gray-950">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  const ancestors = activePageId ? getAncestors(activePageId) : [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 dark:text-gray-100">
      <Sidebar
        pages={pages}
        favoritePages={favoritePages}
        trashedPages={trashedPages}
        activePageId={activePageId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={setActivePageId}
        onCreate={createPage}
        onDelete={deletePage}
        onRestore={restorePage}
        onPermanentDelete={permanentDelete}
        onEmptyTrash={emptyTrash}
        onToggleFavorite={toggleFavorite}
        onReorder={reorderPage}
        onOpenSearch={() => setSearchOpen(true)}
        userEmail={user.email}
        onSignOut={onSignOut}
      />

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        pages={pages}
        onSelect={handleSearchSelect}
      />

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareToken={activePage?.shareToken ?? null}
        onEnableShare={async () => {
          if (!activePageId) return "";
          return enableShare(activePageId);
        }}
        onDisableShare={() => {
          if (activePageId) disableShare(activePageId);
          setShareOpen(false);
        }}
      />

      {/* Top bar when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Partager"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => setDark(!dark)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      )}

      <main
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "ml-0 pt-14" : "md:ml-60"
        }`}
      >
        <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
          {!sidebarCollapsed && activePage && (
            <div className="flex items-center justify-between mb-4">
              <Breadcrumb
                ancestors={ancestors}
                currentPage={activePage}
                onNavigate={setActivePageId}
              />
              <button
                onClick={() => setShareOpen(true)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager
              </button>
            </div>
          )}
          {activePage && (
            <BlockEditor
              key={activePage.id}
              initialContent={initialContent}
              onSave={save}
              collaboration={
                collab
                  ? {
                      fragment: collab.fragment,
                      provider: collab.provider,
                      user: {
                        name: userName,
                        color:
                          collab.provider.awareness.getLocalState()?.user
                            ?.color ?? "#E06C75",
                      },
                    }
                  : undefined
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}
