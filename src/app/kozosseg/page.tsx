"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FeedPost } from "@/lib/types";
import PostComposer from "@/components/feed/PostComposer";
import FeedPostCard from "@/components/feed/FeedPostCard";
import Sidebar from "@/components/Sidebar";

const PAGE_SIZE = 10;

export default function KozossegPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (after?: DocumentSnapshot) => {
    const q = after
      ? query(collection(db, "feed"), orderBy("createdAt", "desc"), startAfter(after), limit(PAGE_SIZE))
      : query(collection(db, "feed"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));

    const snap = await getDocs(q);
    const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedPost));
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    return fetched;
  }, []);

  useEffect(() => {
    loadPosts().then((fetched) => {
      setPosts(fetched);
      setLoading(false);
    });
  }, [loadPosts]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const more = await loadPosts(lastDoc);
    setPosts((prev) => [...prev, ...more]);
    setLoadingMore(false);
  };

  const handlePosted = (post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt a bejegyzést?")) return;
    await deleteDoc(doc(db, "feed", id));
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-blade-dark uppercase tracking-wide">
              Közösségi feed
            </h1>
            <span className="text-xs bg-blade-red text-white px-2 py-0.5 rounded font-semibold">
              ÚJ
            </span>
          </div>

          {/* Composer */}
          <PostComposer onPosted={handlePosted} />

          {/* Feed */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-32" />
                      <div className="h-2.5 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-lg mt-3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🔪</div>
              <h3 className="font-semibold text-blade-dark mb-2">Még üres a feed</h3>
              <p className="text-sm text-gray-400">
                Légy az első, aki megosztja a kedvenc eszközét!
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  onDelete={handleDelete}
                />
              ))}

              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-blade-cream hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Betöltés..." : "Több bejegyzés betöltése"}
                </button>
              )}
            </>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
