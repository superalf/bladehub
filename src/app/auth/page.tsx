"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

function AuthForm() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">(
    params.get("tab") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        if (displayName.trim().length < 3) {
          setError("A felhasználónév legalább 3 karakter legyen.");
          setLoading(false);
          return;
        }
        await register(email, password, displayName.trim());
      }
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Hibás e-mail cím vagy jelszó.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Ez az e-mail cím már regisztrált.");
      } else if (msg.includes("weak-password")) {
        setError("A jelszó legalább 6 karakter legyen.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-bold text-blade-dark">
            BLADE<span className="text-blade-red">HUB</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Cenzúramentes közösség</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "text-blade-red border-b-2 border-blade-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Bejelentkezés
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === "register"
                  ? "text-blade-red border-b-2 border-blade-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Regisztráció
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Felhasználónév
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
                  placeholder="pl. KesesGabor"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail cím
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
                placeholder="te@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jelszó
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
                placeholder={tab === "register" ? "Legalább 6 karakter" : "••••••••"}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blade-red hover:bg-blade-red-dark disabled:opacity-60 text-white py-2.5 rounded font-semibold text-sm transition-colors"
            >
              {loading
                ? "..."
                : tab === "login"
                ? "Bejelentkezés"
                : "Regisztráció"}
            </button>

            {tab === "register" && (
              <p className="text-xs text-gray-400 text-center">
                A regisztrációval elfogadod a használati feltételeket. Az alap funkciók örökre ingyenesek.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
