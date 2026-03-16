"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, LISTING_TYPE_LABELS, LISTING_TYPE_COLORS, CONDITION_LABELS } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = use(params);
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "listings", listingId));
      if (snap.exists()) {
        setListing({ id: snap.id, ...snap.data() } as Listing);
        updateDoc(doc(db, "listings", listingId), { viewCount: increment(1) });
      }
      setLoading(false);
    }
    load();
  }, [listingId]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">Betöltés...</div>;
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">A hirdetés nem található.</p>
        <Link href="/hirdetesek" className="text-blade-red hover:underline mt-2 inline-block">← Hirdetések</Link>
      </div>
    );
  }

  const dateStr = listing.createdAt?.toDate
    ? format(listing.createdAt.toDate(), "yyyy. MMMM d.", { locale: hu })
    : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/hirdetesek" className="hover:text-blade-red">Hirdetések</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
        {/* Left: images + description */}
        <div className="space-y-5">
          {/* Image gallery */}
          <div className="bg-blade-cream-dark rounded-xl overflow-hidden">
            {listing.images.length > 0 ? (
              <>
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listing.images[activeImage]}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {listing.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt=""
                          className={`w-16 h-16 object-cover rounded border-2 transition-colors ${
                            i === activeImage ? "border-blade-red" : "border-transparent"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center text-6xl opacity-20">
                🔪
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-blade-dark mb-3">Leírás</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right: details + contact */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded ${LISTING_TYPE_COLORS[listing.type]}`}>
                {LISTING_TYPE_LABELS[listing.type]}
              </span>
              {listing.status === "sold" && (
                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-600 text-white">
                  ELADVA
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-blade-dark leading-tight mb-3 tracking-wide">
              {listing.title}
            </h1>

            {listing.type === "sell" && listing.price && (
              <div className="text-3xl font-bold text-blade-red mb-4">
                {listing.price.toLocaleString("hu-HU")} Ft
              </div>
            )}

            <div className="space-y-2 text-sm">
              <DetailRow label="Kategória" value={listing.category} />
              <DetailRow label="Állapot" value={CONDITION_LABELS[listing.condition]} />
              <DetailRow label="Helyszín" value={listing.location} />
              <DetailRow label="Feltöltve" value={dateStr} />
              <DetailRow label="Megtekintés" value={`${listing.viewCount}×`} />
            </div>
          </div>

          {/* Seller info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-blade-dark mb-3 text-sm">Hirdető</h3>
            <Link
              href={`/profil/${listing.authorUid}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-blade-dark flex items-center justify-center text-white font-bold">
                {listing.authorName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-sm text-blade-dark">{listing.authorName}</p>
                <p className="text-xs text-gray-400">Profil megtekintése →</p>
              </div>
            </Link>
          </div>

          {/* Contact button */}
          {user && user.uid !== listing.authorUid && listing.status === "active" && (
            <Link
              href={`/uzenet/uj?listingId=${listing.id}&to=${listing.authorUid}`}
              className="block w-full text-center bg-blade-red hover:bg-blade-red-dark text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Üzenet küldése az eladónak
            </Link>
          )}
          {!user && (
            <Link
              href="/auth"
              className="block w-full text-center bg-blade-dark hover:bg-blade-dark-2 text-white py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              Bejelentkezés az üzenetküldéshez
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-blade-dark">{value}</span>
    </div>
  );
}
