"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ServiceGallery({ images, title }: { images: { key: string; description: string }[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((image, i) => (
          <button
            key={image.key}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Ver imagen ${i + 1} de ${images.length} de ${title}`}
            className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-brand-violet/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/avatar?key=${encodeURIComponent(image.key)}`} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        {openIndex !== null && (
          <DialogContent className="sm:max-w-4xl p-0 bg-white border-gray-200">
            <div className="relative flex max-h-[80dvh] min-h-[220px] items-center justify-center px-4 pb-4 pt-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(images[openIndex].key)}`}
                alt={images[openIndex].description || title}
                className="max-h-[70dvh] max-w-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() => setOpenIndex((i) => (i! - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-brand-dark hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => setOpenIndex((i) => (i! + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-brand-dark hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-5 right-6 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-xs text-brand-dark">
                    {openIndex + 1} de {images.length}
                  </span>
                </>
              )}
            </div>
            {images[openIndex].description && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-brand-dark">
                {images[openIndex].description}
              </p>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
