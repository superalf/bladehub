"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FORUM_CATEGORIES } from "@/lib/types";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="space-y-4">
      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        {user ? (
          <>
            <Link
              href="/forum/uj"
              className="block w-full text-center bg-blade-red hover:bg-blade-red-dark text-white py-2 rounded font-medium text-sm transition-colors"
            >
              + Új fórum téma
            </Link>
            <Link
              href="/hirdetesek/uj"
              className="block w-full text-center bg-blade-dark hover:bg-blade-dark-2 text-white py-2 rounded font-medium text-sm transition-colors"
            >
              + Hirdetés feladása
            </Link>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Regisztrálj a teljes élményért!
            </p>
            <Link
              href="/auth?tab=register"
              className="block w-full text-center bg-blade-red hover:bg-blade-red-dark text-white py-2 rounded font-medium text-sm transition-colors"
            >
              Regisztráció — ingyenes
            </Link>
          </div>
        )}
      </div>

      {/* No censorship notice */}
      <div className="bg-blade-dark border border-blade-red/30 rounded-lg p-4">
        <p className="text-xs text-blade-steel-light leading-relaxed">
          <span className="text-blade-red font-semibold block mb-1">
            Cenzúramentes platform
          </span>
          Késeket, fejszéket és multitoolokat nyugodtan fotózhatsz és hirdethetsz — senki nem törli a képeidet.
        </p>
      </div>

      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blade-dark px-4 py-2.5">
          <h3 className="text-sm font-semibold text-white font-display tracking-wide uppercase">
            Kategóriák
          </h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {FORUM_CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/forum?kategoria=${cat.slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blade-cream transition-colors text-sm"
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-gray-700 hover:text-blade-dark font-medium">
                  {cat.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Legal note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-blue-800 mb-1">
          ⚖️ Jogi megjegyzés
        </h4>
        <p className="text-xs text-blue-700 leading-relaxed">
          Magyarországon a legtöbb kés és fejsze legálisan vásárolható és viselhető. Ez nem fegyverplatform — felhasználói felelősség a helyi jogszabályok betartása.
        </p>
      </div>
    </aside>
  );
}
