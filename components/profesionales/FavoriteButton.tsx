"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  type,
  id,
  initialFavorited,
  className,
}: {
  type: "profesional" | "servicio";
  id: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    const next = !favorited;
    try {
      const res = await fetch(`/api/favoritos/${type}/${id}`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) {
        toast.error(res.status === 401 ? "Iniciá sesión para guardar favoritos" : "No se pudo actualizar favoritos");
        return;
      }
      setFavorited(next);
    } catch {
      toast.error("No se pudo actualizar favoritos");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={cn(
        "h-11 w-11 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-brand-bg transition-colors disabled:opacity-50 shrink-0",
        className
      )}
    >
      <Heart size={20} className={favorited ? "fill-brand-violet text-brand-violet" : "text-brand-gray"} />
    </button>
  );
}
