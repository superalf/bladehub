import Link from "next/link";
import { Listing, LISTING_TYPE_LABELS, LISTING_TYPE_COLORS, CONDITION_LABELS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default function ListingCard({ listing }: { listing: Listing }) {
  const timeAgo = listing.createdAt
    ? formatDistanceToNow(listing.createdAt.toDate(), { addSuffix: true, locale: hu })
    : "";

  return (
    <Link href={`/hirdetesek/${listing.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blade-red hover:shadow-md transition-all">
        {/* Image */}
        <div className="aspect-[4/3] bg-blade-cream-dark relative overflow-hidden">
          {listing.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
              🔪
            </div>
          )}
          {/* Type badge */}
          <span
            className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded ${LISTING_TYPE_COLORS[listing.type]}`}
          >
            {LISTING_TYPE_LABELS[listing.type]}
          </span>
          {listing.status === "sold" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display tracking-widest">
                ELADVA
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-blade-dark text-sm leading-tight line-clamp-2 group-hover:text-blade-red transition-colors mb-1">
            {listing.title}
          </h3>

          <div className="flex items-center justify-between mt-2">
            {listing.type === "sell" && listing.price ? (
              <span className="font-bold text-blade-red text-base">
                {listing.price.toLocaleString("hu-HU")} Ft
              </span>
            ) : (
              <span className="text-xs text-gray-500 italic">
                {listing.type === "swap" ? "Csere" : "Keresett"}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{listing.location}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
