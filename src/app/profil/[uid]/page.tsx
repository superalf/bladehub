"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Listing, Thread } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import ThreadCard from "@/components/ThreadCard";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

export default function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const [profile, setProfile] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"listings" | "threads">("listings");

  useEffect(() => {
    async function load() {
      const [profileSnap, listingsSnap, threadsSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDocs(
          query(
            collection(db, "listings"),
            where("authorUid", "==", uid),
            orderBy("createdAt", "desc"),
            limit(20)
          )
        ),
        getDocs(
          query(
            collection(db, "threads"),
            where("authorUid", "==", uid),
            orderBy("createdAt", "desc"),
            limit(20)
          )
        ),
      ]);

      if (profileSnap.exists()) {
        setProfile({ uid, ...profileSnap.data() } as User);
      }
      setListings(listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      setThreads(threadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Thread)));
      setLoading(false);
    }
    load();
  }, [uid]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">Betöltés...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">A felhasználó nem található.</p>
      </div>
    );
  }

  const joinedStr = profile.joinedAt?.toDate
    ? format(profile.joinedAt.toDate(), "yyyy. MMMM", { locale: hu })
    : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="bg-blade-dark rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blade-red flex items-center justify-center text-white text-2xl font-bold">
          {profile.displayName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">
            {profile.displayName}
          </h1>
          {joinedStr && (
            <p className="text-blade-steel text-sm mt-0.5">Tag {joinedStr} óta</p>
          )}
          {profile.bio && (
            <p className="text-blade-steel-light text-sm mt-1">{profile.bio}</p>
          )}
        </div>
        <div className="ml-auto flex gap-6 text-center">
          <div>
            <div className="font-display text-xl font-bold text-white">{profile.karma}</div>
            <div className="text-xs text-blade-steel">Karma</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-white">{profile.listingCount}</div>
            <div className="text-xs text-blade-steel">Hirdetés</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold text-white">{profile.postCount}</div>
            <div className="text-xs text-blade-steel">Bejegyzés</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        <button
          onClick={() => setTab("listings")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "listings" ? "border-blade-red text-blade-red" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Hirdetések ({listings.length})
        </button>
        <button
          onClick={() => setTab("threads")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            tab === "threads" ? "border-blade-red text-blade-red" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Fórum témák ({threads.length})
        </button>
      </div>

      {tab === "listings" ? (
        listings.length === 0 ? (
          <p className="text-gray-400 text-center py-10">Nincs hirdetés.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )
      ) : threads.length === 0 ? (
        <p className="text-gray-400 text-center py-10">Nincs fórum téma.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {threads.map((t) => <ThreadCard key={t.id} thread={t} />)}
        </div>
      )}
    </div>
  );
}
