import { useState } from "react";
import { BlockEditor } from "@/components/Editor/BlockEditor";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AuthPage } from "@/components/Auth/AuthPage";
import { usePages } from "@/lib/usePages";
import { useAuth } from "@/lib/useAuth";
import { useCollaboration } from "@/lib/useCollaboration";

export function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
    activePage,
    activePageId,
    initialContent,
    loading,
    save,
    setActivePageId,
    createPage,
    deletePage,
    getAncestors,
  } = usePages();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const collab = useCollaboration(activePageId, userName);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  const ancestors = activePageId ? getAncestors(activePageId) : [];

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={setActivePageId}
        onCreate={createPage}
        onDelete={deletePage}
        userEmail={user.email}
        onSignOut={onSignOut}
      />

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Ouvrir la sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <main
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "ml-0" : "ml-60"
        }`}
      >
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Breadcrumb
            ancestors={ancestors}
            currentPage={activePage}
            onNavigate={setActivePageId}
          />
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
