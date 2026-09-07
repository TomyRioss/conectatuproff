"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Images, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Item = {
  id: string;
  title: string | null;
  description: string | null;
  costMin: number | null;
  costMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  tags: string[];
  startedAt: Date | null;
  images: { imageUrl: string }[];
};

function formatMonthYear(date: Date) {
  const s = date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PortfolioGalleryGrid({
  items,
  handle,
  isOwner,
  proName,
  proAvatarSrc,
}: {
  items: Item[];
  handle: string;
  isOwner: boolean;
  proName: string;
  proAvatarSrc: string | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const selected = openIndex !== null ? items[openIndex] : null;
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/profesional/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "No se pudo eliminar");
        return;
      }
      toast.success("Proyecto eliminado");
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setOpenIndex(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenIndex(index);
              }
            }}
            className="group text-left rounded-2xl bg-white border border-gray-200 overflow-hidden flex flex-col hover:border-brand-violet/40 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="aspect-video bg-gray-200 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
                alt={item.title ?? "Proyecto"}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {item.images.length > 0 && (
                <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 text-white text-sm px-2.5 py-1.5">
                  <Images size={14} /> {item.images.length}
                </span>
              )}
              {isOwner && (
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-300 ease-in-out">
                  <Link
                    href={`/${handle}/portfolio/edit/${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Editar proyecto"
                    className="h-9 rounded-full bg-white/90 px-3 flex items-center gap-1.5 text-brand-gray hover:text-brand-dark text-xs font-medium"
                  >
                    <Pencil size={14} /> Editar
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={busyId === item.id}
                    aria-label="Eliminar proyecto"
                    className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 flex flex-col gap-1.5 flex-1">
              <h3 className="font-semibold text-brand-dark text-base leading-snug">{item.title || "Sin título"}</h3>
              {item.description && (
                <p className="text-brand-gray text-sm line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        {selected && (
          <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto p-0">
            <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-11 w-11 shrink-0">
                  {proAvatarSrc && <AvatarImage src={proAvatarSrc} alt={proName} />}
                  <AvatarFallback className="bg-brand-violet text-white text-base font-semibold">
                    {proName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base text-brand-gray truncate">
                  Realizado por{" "}
                  <Link
                    href={`/perfil/profesional/${handle}`}
                    className="font-semibold text-brand-dark underline decoration-brand-green decoration-2 underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    {proName}
                  </Link>
                </span>
              </div>

              {items.length > 1 && (
                <div className="flex items-center gap-3 shrink-0 pr-8">
                  <button
                    type="button"
                    aria-label="Proyecto anterior"
                    onClick={() => setOpenIndex((i) => (i! - 1 + items.length) % items.length)}
                    className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-brand-gray whitespace-nowrap">
                    {openIndex! + 1} de {items.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Proyecto siguiente"
                    onClick={() => setOpenIndex((i) => (i! + 1) % items.length)}
                    className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  {selected.startedAt && (
                    <p className="text-sm text-brand-gray">Del: {formatMonthYear(selected.startedAt)}</p>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mt-1 text-balance">{selected.title || "Sin título"}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/perfil/profesional/${handle}/agendar`)}
                  className="shrink-0 bg-brand-dark text-white text-sm font-semibold rounded-xl px-5 py-3 hover:opacity-90 transition-opacity"
                >
                  Agendar cita
                </button>
              </div>

              {selected.description && (
                <p className="text-base text-brand-dark mt-5 whitespace-pre-line leading-relaxed">
                  {selected.description}
                </p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-10 mt-6 pt-6 border-t border-gray-100">
                {(selected.costMin || selected.costMax) && (
                  <div>
                    <p className="text-sm text-brand-gray">Precio</p>
                    <p className="text-base font-bold text-brand-dark mt-1">
                      ${(selected.costMin ?? selected.costMax)!.toLocaleString("es-AR")} ARS
                    </p>
                  </div>
                )}
                {(selected.durationMin || selected.durationMax) && (
                  <div>
                    <p className="text-sm text-brand-gray">Tiempo</p>
                    <p className="text-base font-bold text-brand-dark mt-1">
                      {selected.durationMin ?? selected.durationMax}
                      {selected.durationMax && selected.durationMin !== selected.durationMax ? `-${selected.durationMax}` : ""} días
                    </p>
                  </div>
                )}
                {selected.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-brand-gray">Categoría</p>
                    <p className="text-base font-bold text-brand-dark mt-1">{selected.tags.join(", ")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-8">
                {selected.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={`/api/avatar?key=${encodeURIComponent(img.imageUrl)}`}
                    alt={`${selected.title ?? "Proyecto"} ${i + 1}`}
                    className="w-full rounded-xl border border-gray-200"
                  />
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
