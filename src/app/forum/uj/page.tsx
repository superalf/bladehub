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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { FORUM_CATEGORIES } from "@/lib/types";
import Link from "next/link";

export default function NewThreadPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Bejelentkezés szükséges új téma indításához.</p>
        <Link
          href="/auth"
          className="bg-blade-red text-white px-6 py-2 rounded font-medium hover:bg-blade-red-dark"
        >
          Bejelentkezés
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setError("Válassz kategóriát!"); return; }
    if (body.trim().length < 20) { setError("A bejegyzés legalább 20 karakter legyen."); return; }

    setError("");
    setLoading(true);

    const cat = FORUM_CATEGORIES.find((c) => c.id === categoryId);
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = serverTimestamp();

    try {
      const threadRef = await addDoc(collection(db, "threads"), {
        title: title.trim(),
        categoryId,
        categoryName: cat?.name ?? "",
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        authorAvatar: profile?.avatar ?? null,
        createdAt: now,
        lastReplyAt: now,
        viewCount: 0,
        replyCount: 0,
        tags: tagList,
        isPinned: false,
        isLocked: false,
      });

      await addDoc(collection(db, "threads", threadRef.id, "posts"), {
        threadId: threadRef.id,
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        authorAvatar: profile?.avatar ?? null,
        body: body.trim(),
        images: [],
        createdAt: now,
        likes: [],
        isFirstPost: true,
      });

      // Increment user postCount
      await updateDoc(doc(db, "users", user.uid), { postCount: increment(1) });

      router.push(`/forum/${threadRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Hiba történt, próbáld újra.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/forum" className="text-sm text-blade-red hover:underline">
          ← Fórum
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-display text-2xl font-bold text-blade-dark uppercase tracking-wide">
          Új téma indítása
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategória <span className="text-red-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
            required
          >
            <option value="">— Válassz kategóriát —</option>
            {FORUM_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téma címe <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
            placeholder="pl. Spyderco Paramilitary 2 vélemény"
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bejegyzés szövege <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red resize-y"
            placeholder="Írd le a témát részletesen..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Címkék (vesszővel elválasztva)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red"
            placeholder="pl. spyderco, s30v, flipper"
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
            {loading ? "Küldés..." : "Téma közzététele"}
          </button>
          <Link
            href="/forum"
            className="px-6 py-2.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Mégse
          </Link>
        </div>
      </form>
    </div>
  );
}
