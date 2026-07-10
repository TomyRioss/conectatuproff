"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ServiceGallery({ images, title }: { images: string[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl overflow-hidden bg-brand-bg border border-gray-200 aspect-video cursor-pointer" onClick={() => setOpenIndex(0)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/avatar?key=${encodeURIComponent(images[0])}`}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((key, i) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="h-24 w-36 shrink-0 rounded-lg border border-gray-200 overflow-hidden hover:border-brand-violet/40 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/avatar?key=${encodeURIComponent(key)}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        {openIndex !== null && (
          <DialogContent className="sm:max-w-3xl p-0 bg-black border-none">
            <div className="relative aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(images[openIndex])}`}
                alt={title}
                className="w-full h-full object-contain"
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
                  <span className="absolute bottom-3 right-3 text-xs text-white bg-black/60 rounded-full px-2.5 py-1">
                    {openIndex + 1} de {images.length}
                  </span>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
