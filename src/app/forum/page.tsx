"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Thread, FORUM_CATEGORIES } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function ForumList() {
  const params = useSearchParams();
  const kategoria = params.get("kategoria") ?? "";
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = kategoria
      ? query(
          collection(db, "threads"),
          where("categoryId", "==", kategoria),
          orderBy("lastReplyAt", "desc"),
          limit(30)
        )
      : query(
          collection(db, "threads"),
          orderBy("lastReplyAt", "desc"),
          limit(30)
        );

    getDocs(q)
      .then((snap) => {
        setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Thread)));
      })
      .finally(() => setLoading(false));
  }, [kategoria]);

  const activeCat = FORUM_CATEGORIES.find((c) => c.slug === kategoria);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Category sidebar */}
        <aside>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-20">
            <div className="bg-blade-dark px-4 py-3">
              <h2 className="font-display text-lg font-bold text-white tracking-wide uppercase">
                Kategóriák
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li>
                <Link
                  href="/forum"
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    !kategoria
                      ? "bg-red-50 text-blade-red font-semibold"
                      : "text-gray-700 hover:bg-blade-cream"
                  }`}
                >
                  🗂️ Összes téma
                </Link>
              </li>
              {FORUM_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/forum?kategoria=${cat.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      kategoria === cat.slug
                        ? "bg-red-50 text-blade-red font-semibold"
                        : "text-gray-700 hover:bg-blade-cream"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Thread list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-blade-dark uppercase tracking-wide">
                {activeCat ? (
                  <>
                    {activeCat.icon} {activeCat.name}
                  </>
                ) : (
                  "Összes téma"
                )}
              </h1>
              {activeCat && (
                <p className="text-sm text-gray-500 mt-0.5">{activeCat.description}</p>
              )}
            </div>
            {user && (
              <Link
                href="/forum/uj"
                className="bg-blade-red hover:bg-blade-red-dark text-white px-4 py-2 rounded font-medium text-sm transition-colors"
              >
                + Új téma
              </Link>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {loading ? (
              <div className="p-10 text-center text-gray-400">Betöltés...</div>
            ) : threads.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-gray-400 mb-3">
                  {aktiveCat
                    ? "Ebben a kategóriában még nincs téma."
                    : "Még nincs téma."}
                </p>
                {user && (
                  <Link
                    href="/forum/uj"
                    className="inline-block bg-blade-red text-white px-4 py-2 rounded text-sm font-medium hover:bg-blade-red-dark"
                  >
                    Légy az első!
                  </Link>
                )}
              </div>
            ) : (
              threads.map((t) => <ThreadCard key={t.id} thread={t} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ForumPage() {
  return (
    <Suspense>
      <ForumList />
    </Suspense>
  );
}
