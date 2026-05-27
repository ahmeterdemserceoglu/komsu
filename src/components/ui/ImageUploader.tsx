"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  folder?: string;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 5,
  folder = "listings",
  className = "",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length + uploading.length < maxImages;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Sadece JPG, PNG ve WebP dosyaları yüklenebilir.";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Dosya boyutu en fazla ${maxSizeMB}MB olabilir.`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const preview = URL.createObjectURL(file);

      const uploadingItem: UploadingFile = { id, file, preview, progress: 0 };
      setUploading((prev) => [...prev, uploadingItem]);

      try {
        const storageRef = ref(
          storage,
          `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
        );
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploading((prev) =>
                prev.map((u) => (u.id === id ? { ...u, progress } : u))
              );
            },
            (error) => {
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === id ? { ...u, error: "Yükleme başarısız." } : u
                )
              );
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploading((prev) => prev.filter((u) => u.id !== id));
              URL.revokeObjectURL(preview);
              resolve(downloadURL);
            }
          );
        });
      } catch {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, error: "Yükleme başarısız." } : u
          )
        );
        return null;
      }
    },
    [folder]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const availableSlots = maxImages - images.length - uploading.length;
      const filesToUpload = fileArray.slice(0, availableSlots);

      const validFiles: File[] = [];
      for (const file of filesToUpload) {
        const error = validateFile(file);
        if (error) {
          console.warn(error);
          continue;
        }
        validFiles.push(file);
      }

      const uploadPromises = validFiles.map((file) => uploadFile(file));
      const results = await Promise.allSettled(uploadPromises);

      const newUrls: string[] = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          newUrls.push(result.value);
        }
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
      }
    },
    [images, uploading.length, maxImages, uploadFile, onImagesChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleRemoveUploading = (id: string) => {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((u) => u.id !== id);
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview Grid */}
      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div
              key={`img-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group"
            >
              <img
                src={url}
                alt={`Yüklenen ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#091a35]/80 text-white text-[8px] font-bold rounded">
                  ANA FOTOĞRAF
                </span>
              )}
            </div>
          ))}

          {/* Uploading */}
          {uploading.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <img
                src={item.preview}
                alt="Yükleniyor"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                {item.error ? (
                  <>
                    <span className="text-red-300 text-[9px] font-bold">
                      Hata
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUploading(item.id)}
                      className="mt-1 p-1 bg-red-500 text-white rounded-full cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2 size={20} className="text-white animate-spin" />
                    <span className="text-white text-[10px] font-bold mt-1">
                      %{item.progress}
                    </span>
                  </>
                )}
              </div>
              {/* Progress bar */}
              {!item.error && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-[#f58220] transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-[#f58220] bg-orange-50/50 dark:bg-orange-900/10"
              : "border-slate-300 dark:border-slate-600 hover:border-[#091a35] dark:hover:border-slate-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {dragActive ? (
              <ImageIcon size={32} className="text-[#f58220]" />
            ) : (
              <Upload size={32} className="text-slate-400 dark:text-slate-500" />
            )}
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {dragActive
                ? "Bırakarak yükleyin"
                : "Fotoğraf yüklemek için tıklayın veya sürükleyin"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              JPG, PNG, WebP (Max {maxSizeMB}MB) — {images.length}/{maxImages}{" "}
              fotoğraf
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
