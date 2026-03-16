"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FeedPost, FeedComment } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";
import Link from "next/link";

interface Props {
  post: FeedPost;
  onDelete?: (id: string) => void;
}

export default function FeedPostCard({ post, onDelete }: Props) {
  const { user, profile } = useAuth();
  const [likes, setLikes] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const liked = user ? likes.includes(user.uid) : false;

  const timeAgo = post.createdAt?.toDate
    ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: hu })
    : "";

  const toggleLike = async () => {
    if (!user) return;
    const postRef = doc(db, "feed", post.id);
    if (liked) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      setLikes((prev) => prev.filter((id) => id !== user.uid));
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      setLikes((prev) => [...prev, user.uid]);
    }
  };

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    const snap = await getDocs(
      query(collection(db, "feed", post.id, "comments"), orderBy("createdAt", "asc"))
    );
    setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedComment)));
    setShowComments(true);
    setLoadingComments(false);
  };

  const submitComment = async () => {
    if (!user || !commentText.trim()) return;
    const now = serverTimestamp();
    const ref = await addDoc(collection(db, "feed", post.id, "comments"), {
      postId: post.id,
      authorUid: user.uid,
      authorName: profile?.displayName ?? user.email ?? "Névtelen",
      text: commentText.trim(),
      createdAt: now,
      likes: [],
    });
    await updateDoc(doc(db, "feed", post.id), { commentCount: increment(1) });
    setComments((prev) => [
      ...prev,
      {
        id: ref.id,
        postId: post.id,
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        text: commentText.trim(),
        createdAt: { toDate: () => new Date() } as never,
        likes: [],
      },
    ]);
    setCommentCount((c) => c + 1);
    setCommentText("");
  };

  // Image grid layout
  const imgCount = post.images.length;
  const gridClass =
    imgCount === 1 ? "grid-cols-1" :
    imgCount === 2 ? "grid-cols-2" :
    imgCount === 3 ? "grid-cols-3" :
    "grid-cols-2";

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Link href={`/profil/${post.authorUid}`}>
            <div className="w-10 h-10 rounded-full bg-blade-dark flex items-center justify-center text-white font-bold shrink-0 hover:opacity-80 transition-opacity">
              {post.authorName?.[0]?.toUpperCase() ?? "?"}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profil/${post.authorUid}`}
              className="font-semibold text-sm text-blade-dark hover:text-blade-red transition-colors"
            >
              {post.authorName}
            </Link>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
          {user?.uid === post.authorUid && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
              title="Törlés"
            >
              ×
            </button>
          )}
        </div>

        {/* Text */}
        {post.text && (
          <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.text}
          </p>
        )}

        {/* Images */}
        {imgCount > 0 && (
          <div className={`grid gap-0.5 ${gridClass}`}>
            {post.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxImg(img)}
                className={`overflow-hidden bg-blade-cream-dark ${
                  imgCount === 3 && i === 0 ? "row-span-2 col-span-1" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover aspect-square hover:opacity-95 transition-opacity"
                />
              </button>
            ))}
          </div>
        )}

        {/* Stats bar */}
        {(likes.length > 0 || commentCount > 0) && (
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
            {likes.length > 0 && (
              <span>❤️ {likes.length}</span>
            )}
            {commentCount > 0 && (
              <button onClick={loadComments} className="hover:text-gray-600 transition-colors ml-auto">
                {commentCount} hozzászólás
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex border-t border-gray-100 divide-x divide-gray-100">
          <button
            onClick={toggleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              liked
                ? "text-blade-red bg-red-50"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {liked ? "❤️" : "🤍"} Tetszik
          </button>
          <button
            onClick={loadComments}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            💬 Hozzászólás {commentCount > 0 && `(${commentCount})`}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-3">
            {loadingComments && (
              <p className="text-xs text-gray-400 text-center py-2">Betöltés...</p>
            )}
            {comments.map((c) => (
              <CommentRow key={c.id} comment={c} />
            ))}

            {user ? (
              <div className="flex gap-2 mt-2">
                <div className="w-7 h-7 rounded-full bg-blade-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(profile?.displayName ?? user.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                    placeholder="Írj hozzászólást..."
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-blade-red"
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    className="text-blade-red disabled:opacity-30 font-semibold text-sm hover:text-blade-red-dark transition-colors"
                  >
                    Küld
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="block text-xs text-center text-blade-red hover:underline py-1"
              >
                Bejelentkezés a hozzászóláshoz
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

function CommentRow({ comment }: { comment: FeedComment }) {
  const timeAgo = comment.createdAt?.toDate
    ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: hu })
    : "";
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-blade-dark flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
        {comment.authorName?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1">
        <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2">
          <Link
            href={`/profil/${comment.authorUid}`}
            className="text-xs font-semibold text-blade-dark hover:text-blade-red transition-colors"
          >
            {comment.authorName}
          </Link>
          <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">{timeAgo}</p>
      </div>
    </div>
  );
}
