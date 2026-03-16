"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-blade-dark border-b border-blade-dark-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-2xl font-bold text-white tracking-wide">
            BLADE<span className="text-blade-red">HUB</span>
          </span>
        </Link>

        {/* Main nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <NavLink href="/forum">Fórum</NavLink>
          <NavLink href="/hirdetesek">Hirdetések</NavLink>
          <NavLink href="/tagok">Tagok</NavLink>
        </div>

        {/* Auth */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-blade-steel-light hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blade-red flex items-center justify-center text-white text-xs font-bold">
                  {(profile?.displayName ?? user.email ?? "?")[0].toUpperCase()}
                </div>
                <span className="hidden sm:block">{profile?.displayName ?? user.email}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-blade-dark-2 border border-blade-dark-3 rounded shadow-xl py-1 z-50">
                  <Link
                    href={`/profil/${user.uid}`}
                    className="block px-4 py-2 text-sm text-blade-steel-light hover:text-white hover:bg-blade-dark-3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profilom
                  </Link>
                  <Link
                    href="/uzenet"
                    className="block px-4 py-2 text-sm text-blade-steel-light hover:text-white hover:bg-blade-dark-3 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Üzenetek
                  </Link>
                  <hr className="border-blade-dark-3 my-1" />
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-blade-steel-light hover:text-white hover:bg-blade-dark-3 transition-colors"
                  >
                    Kijelentkezés
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth"
                className="text-sm text-blade-steel-light hover:text-white transition-colors"
              >
                Belépés
              </Link>
              <Link
                href="/auth?tab=register"
                className="text-sm bg-blade-red hover:bg-blade-red-dark text-white px-4 py-1.5 rounded font-medium transition-colors"
              >
                Regisztráció
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-blade-steel-light hover:text-white hover:bg-blade-dark-3 px-3 py-2 rounded transition-colors font-medium"
    >
      {children}
    </Link>
  );
}
