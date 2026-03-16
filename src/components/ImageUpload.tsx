"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import clsx from "clsx";

interface Props {
  path: string; // e.g. "listings/abc123"
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  existingUrls?: string[];
  onRemove?: (url: string) => void;
}

interface UploadItem {
  file: File;
  preview: string;
  progress: number;
  url?: string;
  error?: string;
}

export default function ImageUpload({
  path,
  onUpload,
  maxFiles = 8,
  existingUrls = [],
  onRemove,
}: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxFiles - existingUrls.length - uploads.filter((u) => u.url).length;
      const toProcess = acceptedFiles.slice(0, remaining);

      const newItems: UploadItem[] = toProcess.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setUploads((prev) => [...prev, ...newItems]);

      // Resize + convert to WebP before upload
      toProcess.forEach(async (file, i) => {
        try {
          const compressed = await compressImage(file, 1200, 0.82);
          const fileName = `${Date.now()}_${i}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
          const storageRef = ref(storage, `${path}/${fileName}`);
          const task = uploadBytesResumable(storageRef, compressed);

          task.on(
            "state_changed",
            (snap) => {
              const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
              setUploads((prev) =>
                prev.map((u) => (u.file === file ? { ...u, progress } : u))
              );
            },
            (err) => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.file === file ? { ...u, error: err.message } : u
                )
              );
            },
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              setUploads((prev) =>
                prev.map((u) => (u.file === file ? { ...u, url, progress: 100 } : u))
              );
              // Notify parent with all completed URLs
              const completedUrls = uploads
                .filter((u) => u.url)
                .map((u) => u.url as string)
                .concat(url);
              onUpload(completedUrls);
            }
          );
        } catch {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, error: "Feldolgozási hiba" } : u
            )
          );
        }
      });
    },
    [path, uploads, existingUrls.length, maxFiles, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxSize: 20 * 1024 * 1024,
    disabled: existingUrls.length + uploads.filter((u) => u.url).length >= maxFiles,
  });

  return (
    <div className="space-y-3">
      {/* Existing images */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {existingUrls.map((url) => (
            <div key={url} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover rounded" />
              {onRemove && (
                <button
                  onClick={() => onRemove(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {uploads.map((item, i) => (
            <div key={i} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                className="w-full h-full object-cover rounded"
              />
              {item.progress < 100 && !item.error && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <div className="text-white text-xs font-semibold">
                    {Math.round(item.progress)}%
                  </div>
                </div>
              )}
              {item.error && (
                <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center rounded">
                  <span className="text-white text-xs text-center px-1">Hiba</span>
                </div>
              )}
              {item.url && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blade-red bg-red-50"
            : "border-gray-300 hover:border-blade-red hover:bg-blade-cream"
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-500">
          {isDragActive
            ? "Engedd el a képeket..."
            : "Húzd ide a képeket, vagy kattints a tallózáshoz"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WebP, HEIC — max 20 MB/kép, legfeljebb {maxFiles} kép
        </p>
      </div>
    </div>
  );
}

async function compressImage(
  file: File,
  maxWidth: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Blob error"));
        },
        "image/webp",
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
