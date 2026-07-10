"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function RemoveFavoriteMenu({
  type,
  id,
}: {
  type: "profesional" | "servicio";
  id: string;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function remove(e: Event) {
    e.preventDefault();
    setRemoving(true);
    try {
      const res = await fetch(`/api/favoritos/${type}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("No se pudo quitar de favoritos");
        return;
      }
      router.refresh();
    } catch {
      toast.error("No se pudo quitar de favoritos");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          disabled={removing}
          aria-label="Más opciones"
          className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-brand-bg transition-colors shrink-0 disabled:opacity-50"
        >
          <MoreHorizontal size={16} className="text-brand-gray" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200">
        <DropdownMenuItem onSelect={remove} className="text-brand-dark gap-2 cursor-pointer">
          <Heart size={14} className="fill-brand-violet text-brand-violet" /> Quitar de favoritos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
