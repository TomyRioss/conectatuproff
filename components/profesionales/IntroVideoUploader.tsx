"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntroVideoUploader({ name }: { name?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function getDuration(file: File) {
    return new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error("No se pudo leer el video"));
      video.src = URL.createObjectURL(file);
    });
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      let duration: number;
      try {
        duration = await getDuration(file);
      } catch {
        toast.error("No se pudo leer la duración del video");
        return;
      }
      if (duration < 20) {
        toast.error("El video debe durar al menos 20 segundos");
        return;
      }
      if (duration > 60) {
        toast.error("El video no puede durar más de 60 segundos");
        return;
      }

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
    <div>
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
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="border-gray-200 text-brand-dark gap-2"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {uploading ? "Subiendo..." : "Agregar video de introducción"}
      </Button>
    </div>
  );
}
