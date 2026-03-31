import { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  shareToken: string | null;
  onEnableShare: () => Promise<string>;
  onDisableShare: () => void;
}

export function ShareDialog({
  open,
  onClose,
  shareToken,
  onEnableShare,
  onDisableShare,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const shareUrl = shareToken
    ? `${window.location.origin}?share=${shareToken}`
    : null;

  const handleEnable = async () => {
    setLoading(true);
    await onEnableShare();
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Partager cette page</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {shareUrl ? (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toute personne avec ce lien peut voir et modifier cette page.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-600 dark:text-gray-300 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
              <button
                onClick={onDisableShare}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Désactiver le partage
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Génère un lien pour partager cette page avec d'autres personnes. Elles pourront la voir et la modifier.
              </p>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "..." : "Activer le partage"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
