"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  LISTING_CATEGORIES,
  LISTING_TYPE_LABELS,
  ListingType,
  ListingCondition,
  CONDITION_LABELS,
  HUNGARY_COUNTIES,
} from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

export default function NewListingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<ListingType>("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Bejelentkezés szükséges hirdetés feladásához.</p>
        <Link href="/auth" className="bg-blade-red text-white px-6 py-2 rounded font-medium hover:bg-blade-red-dark">
          Bejelentkezés
        </Link>
      </div>
    );
  }

  // Listing ID for image path (pre-generated)
  const [listingId] = useState(() => `lst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { setError("Válassz kategóriát!"); return; }
    if (!location) { setError("Válassz helyszínt!"); return; }
    if (description.trim().length < 20) { setError("A leírás legalább 20 karakter legyen."); return; }
    if (type === "sell" && !price) { setError("Adj meg árat!"); return; }

    setError("");
    setLoading(true);

    const now = serverTimestamp();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    try {
      await addDoc(collection(db, "listings"), {
        id: listingId,
        type,
        title: title.trim(),
        description: description.trim(),
        price: type === "sell" && price ? parseInt(price) : null,
        condition,
        category,
        location,
        images,
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        authorAvatar: profile?.avatar ?? null,
        status: "active",
        createdAt: now,
        expiresAt,
        viewCount: 0,
      });

      await updateDoc(doc(db, "users", user.uid), { listingCount: increment(1) });

      router.push("/hirdetesek");
    } catch (err) {
      console.error(err);
      setError("Hiba történt, próbáld újra.");
      setLoading(false);
    }
  };

  const types: { value: ListingType; label: string; desc: string }[] = [
    { value: "sell", label: "Eladó", desc: "Eszközt szeretnék eladni" },
    { value: "swap", label: "Csere", desc: "Cserére kínálom" },
    { value: "wanted", label: "Keresett", desc: "Ilyet keresek" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/hirdetesek" className="text-sm text-blade-red hover:underline">
          ← Hirdetések
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-display text-2xl font-bold text-blade-dark uppercase tracking-wide">
          Hirdetés feladása
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type selector */}
        <div className="grid grid-cols-3 gap-3">
          {types.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`border-2 rounded-lg p-3 text-left transition-colors ${
                type === t.value
                  ? "border-blade-red bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm text-blade-dark">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hirdetés címe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
              placeholder="pl. Benchmade Bugout 535 — kiváló állapot"
              maxLength={100}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategória <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
              >
                <option value="">— Válassz —</option>
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Helyszín <span className="text-red-500">*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
              >
                <option value="">— Válassz —</option>
                {HUNGARY_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {type === "sell" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ár (Ft) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
                  placeholder="pl. 25000"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Állapot
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
                >
                  {Object.entries(CONDITION_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leírás <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red resize-y"
              placeholder="Részletes leírás, acéltípus, markolat anyaga, méretek, állapot részletei, esetleges hibák..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Képek (max 8)
            </label>
            <ImageUpload
              path={`listings/${listingId}`}
              onUpload={setImages}
              maxFiles={8}
              existingUrls={images}
              onRemove={(url) => setImages((prev) => prev.filter((u) => u !== url))}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blade-red hover:bg-blade-red-dark disabled:opacity-60 text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors"
            >
              {loading ? "Közzététel..." : `${LISTING_TYPE_LABELS[type]} hirdetés közzététele`}
            </button>
            <Link
              href="/hirdetesek"
              className="px-6 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Mégse
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
