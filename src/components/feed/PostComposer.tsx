"use client";

import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { FeedPost } from "@/lib/types";
import Link from "next/link";

interface Props {
  onPosted: (post: FeedPost) => void;
}

export default function PostComposer({ onPosted }: Props) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-sm text-gray-500 mb-3">
          Csatlakozz a közösséghez — oszd meg a kedvenc eszközödet!
        </p>
        <Link
          href="/auth?tab=register"
          className="inline-block bg-blade-red text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blade-red-dark transition-colors"
        >
          Regisztráció — ingyenes
        </Link>
      </div>
    );
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxW = 1200;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/webp", 0.82);
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) return;
    setUploading(true);

    try {
      const postId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const compressed = await compressImage(images[i]);
        const storageRef = ref(storage, `feed/${postId}/${i}.webp`);
        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, compressed);
          task.on(
            "state_changed",
            (snap) => setProgress(((i + snap.bytesTransferred / snap.totalBytes) / images.length) * 100),
            reject,
            async () => {
              uploadedUrls.push(await getDownloadURL(task.snapshot.ref));
              resolve();
            }
          );
        });
      }

      const now = serverTimestamp();
      const docRef = await addDoc(collection(db, "feed"), {
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        authorAvatar: profile?.avatar ?? null,
        text: text.trim(),
        images: uploadedUrls,
        createdAt: now,
        likes: [],
        commentCount: 0,
        tags: [],
      });

      await updateDoc(doc(db, "users", user.uid), { karma: increment(2) });

      onPosted({
        id: docRef.id,
        authorUid: user.uid,
        authorName: profile?.displayName ?? user.email ?? "Névtelen",
        text: text.trim(),
        images: uploadedUrls,
        createdAt: { toDate: () => new Date() } as never,
        likes: [],
        commentCount: 0,
        tags: [],
      });

      setText("");
      setImages([]);
      setPreviews([]);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const initials = (profile?.displayName ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-blade-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mutasd meg a gyűjteményed! Milyen kés, fejsze vagy multitool van nálad?"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blade-red resize-none placeholder:text-gray-400"
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div className={`grid gap-2 mt-2 ${previews.length === 1 ? "grid-cols-1" : previews.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              {previews.length < 4 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blade-red hover:text-blade-red transition-colors text-2xl"
                >
                  +
                </button>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploading && progress > 0 && progress < 100 && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blade-red transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= 4}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blade-red hover:bg-red-50 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>📷</span> Kép hozzáadása
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={uploading || (!text.trim() && images.length === 0)}
              className="bg-blade-red hover:bg-blade-red-dark disabled:opacity-40 text-white px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {uploading ? "Feltöltés..." : "Közzététel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
