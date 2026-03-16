import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BladeHub — Kések, fejszék, multitoolok közössége",
  description:
    "Magyar cenzúramentes közösségi oldal kések, fejszék, balták és multitoolok rajongóinak. Fórum, hirdetések, csere.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-blade-dark text-blade-steel text-xs text-center py-6 mt-16">
            <p>© 2024 BladeHub.hu — Cenzúramentes közösség kések és eszközök szerelmeseinek</p>
            <p className="mt-1 text-blade-dark-3">
              A platform nem vállal felelősséget a hirdetések tartalmáért. Csak legális eszközök hirdetése engedélyezett.
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
