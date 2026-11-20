"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
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
  images: { imageUrl: string; title: string | null }[];
};

// flechas laterales: navegan imágenes sin abrir el detalle
function CardMedia({ item }: { item: PortfolioItem }) {
  const [index, setIndex] = useState(0);
  const keys = item.images.length > 0 ? item.images.map((i) => i.imageUrl) : [item.imageUrl];
  const multi = keys.length > 1;

  const go = (delta: number) => (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + delta + keys.length) % keys.length);
  };
  const arrow =
    "absolute top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/90 text-brand-dark shadow transition-opacity hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:outline-none";

  return (
    <div className="relative aspect-video bg-gray-100">
      <PortfolioMedia
        mediaKey={keys[index]}
        alt={item.title || "Trabajo realizado"}
        className="absolute inset-0"
      />
      {multi && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={go(-1)}
            onKeyDown={(e) => e.stopPropagation()}
            className={`${arrow} left-2`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={go(1)}
            onKeyDown={(e) => e.stopPropagation()}
            className={`${arrow} right-2`}
          >
            <ChevronRight size={18} />
          </button>
          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            <Images size={14} /> {index + 1}/{keys.length}
          </span>
        </>
      )}
    </div>
  );
}

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
              <CardMedia item={item} />
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
            media:
              selected.images.length > 0
                ? selected.images.map((i) => ({ key: i.imageUrl, title: i.title }))
                : [{ key: selected.imageUrl, title: null }],
          }
        }
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
