"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function IntroVideoDeleteButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar el video de presentación?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profesional/video", { method: "DELETE" });
      if (!res.ok) {
        toast.error("No se pudo eliminar el video");
        return;
      }
      toast.success("Video eliminado");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar el video");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Eliminar video"
      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-60"
    >
      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
