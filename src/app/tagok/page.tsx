"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/lib/types";
import Link from "next/link";

export default function TagokPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("karma", "desc"), limit(50)))
      .then((snap) =>
        setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User)))
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-blade-dark uppercase tracking-wide mb-6">
        Tagok
      </h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Betöltés...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((u) => (
            <Link
              key={u.uid}
              href={`/profil/${u.uid}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blade-red hover:shadow-sm transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-blade-dark flex items-center justify-center text-white font-bold shrink-0">
                {u.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blade-dark text-sm truncate">{u.displayName}</p>
                {u.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{u.bio}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-blade-red">{u.karma}</div>
                <div className="text-xs text-gray-400">karma</div>
              </div>
            </Link>
          ))}
          {users.length === 0 && (
            <p className="text-gray-400 col-span-3 text-center py-10">Még nincs tag.</p>
          )}
        </div>
      )}
    </div>
  );
}
