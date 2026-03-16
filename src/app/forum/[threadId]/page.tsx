"use client";

import { useEffect, useState, use } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Thread, Post } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

export default function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const { user, profile } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    async function load() {
      const [threadSnap, postsSnap] = await Promise.all([
        getDoc(doc(db, "threads", threadId)),
        getDocs(
          query(
            collection(db, "threads", threadId, "posts"),
            orderBy("createdAt", "asc")
          )
        ),
      ]);

      if (threadSnap.exists()) {
        setThread({ id: threadSnap.id, ...threadSnap.data() } as Thread);
        // Increment view count
        updateDoc(doc(db, "threads", threadId), { viewCount: increment(1) });
      }
      setPosts(
        postsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
      );
      setLoading(false);
    }
    load();
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || replyBody.trim().length < 3) return;

    setReplying(true);
    const now = serverTimestamp();
    try {
      const postRef = await addDoc(
        collection(db, "threads", threadId, "posts"),
        {
          threadId,
          authorUid: user.uid,
          authorName: profile?.displayName ?? user.email ?? "Névtelen",
          authorAvatar: profile?.avatar ?? null,
          body: replyBody.trim(),
          images: [],
          createdAt: now,
          likes: [],
          isFirstPost: false,
        }
      );

      await updateDoc(doc(db, "threads", threadId), {
        replyCount: increment(1),
        lastReplyAt: now,
      });
      await updateDoc(doc(db, "users", user.uid), { postCount: increment(1) });

      // Optimistic update
      setPosts((prev) => [
        ...prev,
        {
          id: postRef.id,
          threadId,
          authorUid: user.uid,
          authorName: profile?.displayName ?? user.email ?? "Névtelen",
          body: replyBody.trim(),
          images: [],
          createdAt: { toDate: () => new Date() } as never,
          likes: [],
          isFirstPost: false,
        },
      ]);
      setReplyBody("");
    } finally {
      setReplying(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    const postRef = doc(db, "threads", threadId, "posts", post.id);
    const liked = post.likes.includes(user.uid);
    await updateDoc(postRef, {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likes: liked
                ? p.likes.filter((id) => id !== user.uid)
                : [...p.likes, user.uid],
            }
          : p
      )
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center text-gray-400">
        Betöltés...
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">A téma nem található.</p>
        <Link href="/forum" className="text-blade-red hover:underline mt-2 inline-block">
          ← Vissza a fórumhoz
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/forum" className="hover:text-blade-red">Fórum</Link>
        <span>/</span>
        <Link
          href={`/forum?kategoria=${thread.categoryId}`}
          className="hover:text-blade-red"
        >
          {thread.categoryName}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{thread.title}</span>
      </div>

      {/* Thread header */}
      <div className="bg-blade-dark rounded-lg px-6 py-5 mb-6">
        <h1 className="font-display text-2xl font-bold text-white tracking-wide mb-1">
          {thread.title}
        </h1>
        <div className="flex flex-wrap gap-2 text-xs text-blade-steel mt-2">
          {thread.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        <div className="text-xs text-blade-steel mt-3">
          {thread.viewCount} megtekintés · {thread.replyCount} válasz
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <PostCard
            key={post.id}
            post={post}
            postNumber={idx + 1}
            currentUid={user?.uid}
            onLike={toggleLike}
          />
        ))}
      </div>

      {/* Reply form */}
      {!thread.isLocked && user ? (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-blade-dark mb-3 text-sm">Válasz írása</h3>
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blade-red resize-y"
              placeholder="Írd ide a válaszodat..."
            />
            <button
              type="submit"
              disabled={replying || replyBody.trim().length < 3}
              className="bg-blade-red hover:bg-blade-red-dark disabled:opacity-50 text-white px-5 py-2 rounded font-semibold text-sm transition-colors"
            >
              {replying ? "Küldés..." : "Válasz küldése"}
            </button>
          </form>
        </div>
      ) : !user ? (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Válaszoláshoz be kell jelentkezni.
          </p>
          <Link
            href="/auth"
            className="inline-block bg-blade-red text-white px-5 py-2 rounded font-medium text-sm hover:bg-blade-red-dark"
          >
            Bejelentkezés
          </Link>
        </div>
      ) : (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
          Ez a téma le van zárva, nem lehet rá válaszolni.
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  postNumber,
  currentUid,
  onLike,
}: {
  post: Post;
  postNumber: number;
  currentUid?: string;
  onLike: (post: Post) => void;
}) {
  const liked = currentUid ? post.likes.includes(currentUid) : false;
  const timeAgo = post.createdAt?.toDate
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: hu })
    : "";
  const dateStr = post.createdAt?.toDate
    ? format(post.createdAt.toDate(), "yyyy. MM. dd. HH:mm")
    : "";

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden ${
        post.isFirstPost ? "border-blade-red/20" : "border-gray-200"
      }`}
    >
      <div className="flex">
        {/* Author panel */}
        <div className="w-32 shrink-0 bg-blade-cream-dark border-r border-gray-100 p-4 flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blade-dark flex items-center justify-center text-white font-bold">
            {post.authorName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <p className="text-xs font-semibold text-blade-dark leading-tight">
            {post.authorName}
          </p>
          <span className="text-xs text-gray-400">#{postNumber}</span>
        </div>

        {/* Post content */}
        <div className="flex-1 p-4">
          <div className="post-body text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.body}
          </div>

          {post.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {post.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="rounded w-full aspect-square object-cover"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400" title={dateStr}>
              {timeAgo}
            </span>
            <button
              onClick={() => onLike(post)}
              className={`text-xs flex items-center gap-1 transition-colors ${
                liked ? "text-blade-red" : "text-gray-400 hover:text-blade-red"
              }`}
            >
              ♥ {post.likes.length > 0 && post.likes.length}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
