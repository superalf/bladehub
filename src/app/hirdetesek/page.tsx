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
import { Listing, LISTING_CATEGORIES, ListingType, LISTING_TYPE_LABELS } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function ListingsContent() {
  const params = useSearchParams();
  const type = (params.get("tipus") as ListingType) ?? "";
  const cat = params.get("kategoria") ?? "";
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let q;
    if (type) {
      q = query(
        collection(db, "listings"),
        where("type", "==", type),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(40)
      );
    } else if (cat) {
      q = query(
        collection(db, "listings"),
        where("category", "==", cat),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(40)
      );
    } else {
      q = query(
        collection(db, "listings"),
        orderBy("createdAt", "desc"),
        limit(40)
      );
    }
    getDocs(q)
      .then((snap) =>
        setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)))
      )
      .finally(() => setLoading(false));
  }, [type, cat]);

  const types: { value: ListingType | ""; label: string }[] = [
    { value: "", label: "Összes" },
    { value: "sell", label: LISTING_TYPE_LABELS.sell },
    { value: "swap", label: LISTING_TYPE_LABELS.swap },
    { value: "wanted", label: LISTING_TYPE_LABELS.wanted },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-blade-dark uppercase tracking-wide">
          Hirdetések
        </h1>
        {user && (
          <Link
            href="/hirdetesek/uj"
            className="bg-blade-red hover:bg-blade-red-dark text-white px-5 py-2 rounded font-medium text-sm transition-colors"
          >
            + Hirdetés feladása
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {types.map(({ value, label }) => (
            <Link
              key={value}
              href={value ? `/hirdetesek?tipus=${value}` : "/hirdetesek"}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                type === value
                  ? "bg-blade-dark text-white"
                  : "text-gray-600 hover:bg-blade-cream"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <select
          value={cat}
          onChange={(e) =>
            (window.location.href = e.target.value
              ? `/hirdetesek?kategoria=${e.target.value}`
              : "/hirdetesek")
          }
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 bg-white"
        >
          <option value="">Minden kategória</option>
          {LISTING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Betöltés...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Nincs hirdetés ebben a szűrőben.</p>
          {user && (
            <Link
              href="/hirdetesek/uj"
              className="inline-block bg-blade-red text-white px-5 py-2 rounded font-medium hover:bg-blade-red-dark"
            >
              Légy az első!
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HirdetesekPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
