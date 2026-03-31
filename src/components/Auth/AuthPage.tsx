import { useState } from "react";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<any>;
  onSignUp: (email: string, password: string) => Promise<any>;
}

export function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const err = isSignUp
      ? await onSignUp(email, password)
      : await onSignIn(email, password);

    setSubmitting(false);

    if (err) {
      setError(err.message);
    } else if (isSignUp) {
      setMessage("Vérifie ta boîte mail pour confirmer ton compte.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Notions
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
        >
          <h2 className="text-lg font-medium text-gray-800">
            {isSignUp ? "Créer un compte" : "Se connecter"}
          </h2>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? "..."
              : isSignUp
                ? "Créer le compte"
                : "Se connecter"}
          </button>

          <p className="text-sm text-center text-gray-500">
            {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-gray-900 font-medium hover:underline"
            >
              {isSignUp ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
