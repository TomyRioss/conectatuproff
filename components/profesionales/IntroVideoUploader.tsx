"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { directUpload } from "@/lib/direct-upload";

export function IntroVideoUploader({ name: _name }: { name?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function getDuration(file: File) {
    return new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const src = URL.createObjectURL(file);
      // iOS Safari a veces nunca dispara loadedmetadata: timeout evita "Subiendo..." infinito.
      const timer = setTimeout(() => {
        URL.revokeObjectURL(src);
        reject(new Error("timeout"));
      }, 10000);
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(src);
        resolve(video.duration);
      };
      video.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(src);
        reject(new Error("No se pudo leer el video"));
      };
      video.src = src;
      video.load();
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

      if (file.size > 50 * 1024 * 1024) {
        toast.error("El video no puede pesar más de 50 MB");
        return;
      }

      const { key } = await directUpload("/api/profesional/video", file);
      const res = await fetch("/api/profesional/video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "No se pudo subir el video");
        return;
      }
      toast.success("Video subido");
      router.refresh();
    } catch (e) {
      console.error("IntroVideoUploader", e);
      toast.error(e instanceof Error ? e.message : "No se pudo subir el video");
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
          // reset: permite volver a elegir el mismo archivo tras un error
          e.target.value = "";
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
