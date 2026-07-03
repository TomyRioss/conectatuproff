"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

export function IntroVideoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profesional/video", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "No se pudo subir el video");
        return;
      }
      toast.success("Video subido");
      router.refresh();
    } catch {
      toast.error("No se pudo subir el video");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-brand-bg border border-gray-200 flex flex-col items-center justify-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center gap-2 text-brand-gray hover:text-brand-violet transition-colors disabled:opacity-60"
      >
        {uploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
        <span className="text-sm font-medium">
          {uploading ? "Subiendo..." : "Subir video de presentación"}
        </span>
      </button>
    </div>
  );
}
