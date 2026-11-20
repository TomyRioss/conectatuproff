"use client";

import { useState } from "react";
import { Images } from "lucide-react";
import { PortfolioMedia } from "@/components/profesionales/PortfolioMedia";
import { PortfolioDetailDialog, formatRange } from "@/components/profesionales/PortfolioDetailDialog";

type PortfolioItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  costMin: number | null;
  costMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  images: { imageUrl: string }[];
};

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="portfolio-heading" className="space-y-3">
      <div>
        <h2 id="portfolio-heading" className="text-xs font-semibold tracking-wide uppercase text-brand-gray">
          Publicaciones
        </h2>
        <p className="mt-1 text-xl font-bold text-brand-dark">Trabajos realizados</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const mediaKey = item.images[0]?.imageUrl || item.imageUrl;
          const cost = formatRange(item.costMin, item.costMax, (value) =>
            `$${value.toLocaleString("es-AR")}`,
          );
          const duration = formatRange(item.durationMin, item.durationMax, String);

          return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalles: ${item.title || "Publicación"}`}
              onClick={() => setSelected(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(item);
                }
              }}
              className="flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              <div className="relative aspect-video bg-gray-100">
                <PortfolioMedia
                  mediaKey={mediaKey}
                  alt={item.title || "Trabajo realizado"}
                  className="absolute inset-0"
                />
                {item.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                    <Images size={14} /> {item.images.length}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-sm font-semibold leading-snug text-brand-dark">
                  {item.title || "Publicación"}
                </h3>
                {item.description && (
                  <p className="text-xs leading-relaxed text-brand-gray line-clamp-3">
                    {item.description}
                  </p>
                )}
                {(cost || duration) && (
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2 text-sm">
                    {cost ? <span className="font-bold text-brand-dark">{cost}</span> : <span />}
                    {duration && <span className="text-right text-xs text-brand-gray">{duration} horas</span>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <PortfolioDetailDialog
        item={
          selected && {
            ...selected,
            media: selected.images.length > 0 ? selected.images.map((i) => i.imageUrl) : [selected.imageUrl],
          }
        }
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
