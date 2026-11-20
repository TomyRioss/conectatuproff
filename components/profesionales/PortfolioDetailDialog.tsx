"use client";

import { useEffect, useState } from "react";
import { PortfolioMedia, isVideoKey } from "@/components/profesionales/PortfolioMedia";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export type PortfolioDetail = {
  title: string | null;
  description: string | null;
  costMin: number | null;
  costMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  media: { key: string; title: string | null }[];
};

export function formatRange(min: number | null, max: number | null, format: (value: number) => string) {
  if (min == null && max == null) return null;
  if (min == null) return format(max!);
  if (max == null || max === min) return format(min);
  return `${format(min)}-${format(max)}`;
}

// punto del puntero en % del elemento: origen del zoom
function pointOf(e: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
    y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
  };
}

export function PortfolioDetailDialog({
  item,
  onClose,
}: {
  item: PortfolioDetail | null;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setZoom(null);
    };
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const cost = item ? formatRange(item.costMin, item.costMax, (v) => `$${v.toLocaleString("es-AR")}`) : null;
  const duration = item ? formatRange(item.durationMin, item.durationMax, String) : null;

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (open) return;
        setZoom(null);
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {item && (
          <>
            <div className="space-y-1.5 pr-10">
              <DialogTitle className="leading-snug">{item.title || "Publicación"}</DialogTitle>
              <DialogDescription className="sr-only">Detalles de la publicación</DialogDescription>
            </div>
            <Carousel setApi={setApi} opts={{ watchDrag: !zoom }} className="w-full min-w-0">
              <CarouselContent>
                {item.media.map(({ key, title }, i) => (
                  <CarouselItem key={key}>
                    <div
                      className={`relative aspect-video overflow-hidden rounded-xl bg-gray-100 ${
                        isVideoKey(key) ? "" : zoom ? "cursor-zoom-out touch-none" : "cursor-zoom-in"
                      }`}
                      onClick={isVideoKey(key) ? undefined : (e) => (zoom ? setZoom(null) : setZoom(pointOf(e)))}
                      onPointerMove={zoom ? (e) => setZoom(pointOf(e)) : undefined}
                    >
                      <div
                        className="absolute inset-0 transition-transform duration-200"
                        style={zoom ? { transform: "scale(2.5)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                      >
                        <PortfolioMedia
                          mediaKey={key}
                          alt={title || `${item.title || "Trabajo realizado"} (${i + 1} de ${item.media.length})`}
                          controls
                          contain
                          className="absolute inset-0"
                        />
                      </div>
                      {title && (
                        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3 pt-8 text-sm font-medium text-white">
                          {title}
                        </p>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {item.media.length > 1 && (
                <>
                  <CarouselPrevious className="left-2 h-10 w-10 bg-white/90 border-gray-200 text-brand-dark shadow disabled:opacity-0" />
                  <CarouselNext className="right-2 h-10 w-10 bg-white/90 border-gray-200 text-brand-dark shadow disabled:opacity-0" />
                  <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white">
                    {current + 1} / {item.media.length}
                  </span>
                </>
              )}
            </Carousel>
            {item.media.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {item.media.map(({ key }, i) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Ver archivo ${i + 1}`}
                    aria-current={i === current}
                    onClick={() => api?.scrollTo(i)}
                    className={`h-2 cursor-pointer rounded-full transition-all ${i === current ? "w-5 bg-brand-dark" : "w-2 bg-gray-300"}`}
                  />
                ))}
              </div>
            )}
            {item.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-brand-gray">{item.description}</p>
            )}
            {(cost || duration) && (
              <div className="flex items-end justify-between gap-3 border-t border-gray-200 pt-3 text-sm">
                {cost ? <span className="font-bold text-brand-dark">{cost}</span> : <span />}
                {duration && <span className="text-xs text-brand-gray">{duration} horas</span>}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
