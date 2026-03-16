"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Thread, Listing, FORUM_CATEGORIES } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import ListingCard from "@/components/ListingCard";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

interface Stats {
  users: number;
  threads: number;
  listings: number;
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, threads: 0, listings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [threadsSnap, listingsSnap, usersCount, threadsCount, listingsCount] =
          await Promise.all([
            getDocs(query(collection(db, "threads"), orderBy("lastReplyAt", "desc"), limit(6))),
            getDocs(query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(8))),
            getCountFromServer(collection(db, "users")),
            getCountFromServer(collection(db, "threads")),
            getCountFromServer(collection(db, "listings")),
          ]);

        setThreads(
          threadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Thread))
        );
        setListings(
          listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing))
        );
        setStats({
          users: usersCount.data().count,
          threads: threadsCount.data().count,
          listings: listingsCount.data().count,
        });
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="bg-blade-dark rounded-xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_0,transparent_50%)] bg-[length:10px_10px]" />
        <div className="relative">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 tracking-wide">
            BLADE<span className="text-blade-red">HUB</span>
          </h1>
          <p className="text-blade-steel-light text-lg mb-6">
            Magyar közösség kések, fejszék és multitoolok szerelmeseinek.
            <span className="text-white font-medium"> Cenzúramentes.</span>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm">
            <StatBox value={stats.users} label="Tag" />
            <StatBox value={stats.threads} label="Téma" />
            <StatBox value={stats.listings} label="Hirdetés" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-8">
          {/* Forum section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl font-bold text-blade-dark tracking-wide uppercase">
                Fórum — Legújabb témák
              </h2>
              <Link
                href="/forum"
                className="text-sm text-blade-red hover:text-blade-red-dark font-medium"
              >
                Összes →
              </Link>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap mb-4">
              {FORUM_CATEGORIES.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/forum?kategoria=${cat.slug}`}
                  className="text-xs bg-white border border-gray-200 hover:border-blade-red text-gray-600 hover:text-blade-red px-3 py-1 rounded-full transition-colors"
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Betöltés...</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 mb-3">Még nincs téma. Légy az első!</p>
                  <Link
                    href="/forum/uj"
                    className="inline-block bg-blade-red text-white px-4 py-2 rounded text-sm font-medium hover:bg-blade-red-dark transition-colors"
                  >
                    + Új téma indítása
                  </Link>
                </div>
              ) : (
                threads.map((t) => <ThreadCard key={t.id} thread={t} />)
              )}
            </div>
          </section>

          {/* Marketplace section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl font-bold text-blade-dark tracking-wide uppercase">
                Hirdetések
              </h2>
              <Link
                href="/hirdetesek"
                className="text-sm text-blade-red hover:text-blade-red-dark font-medium"
              >
                Összes →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Betöltés...</div>
            ) : listings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-3">Még nincs hirdetés.</p>
                <Link
                  href="/hirdetesek/uj"
                  className="inline-block bg-blade-red text-white px-4 py-2 rounded text-sm font-medium hover:bg-blade-red-dark transition-colors"
                >
                  + Hirdetés feladása
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            )}
          </section>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-bold text-white">
        {value.toLocaleString("hu-HU")}
      </div>
      <div className="text-xs text-blade-steel">{label}</div>
    </div>
  );
}
