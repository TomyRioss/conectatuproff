"use client";

import { useState } from "react";
import Link from "next/link";
import { Images } from "lucide-react";

type PortfolioItem = {
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

export function PortfolioSection({ items, handle }: { items: PortfolioItem[]; handle: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const active = items[activeIndex];
  const thumbItems = items.slice(0, 2);
  const extraCount = items.length - 2;

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-dark mb-4">Portfolio</h2>

      <div className="flex gap-6">
        <Link
          href={`/${handle}/portfolio`}
          className="flex-1 bg-white rounded-2xl border border-gray-200 p-10 flex flex-col md:flex-row gap-10 hover:border-brand-violet/40 hover:shadow-sm transition-all"
        >
          <div className="md:w-3/5 aspect-video rounded-xl overflow-hidden bg-brand-bg shrink-0 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/avatar?key=${encodeURIComponent(active.images[0]?.imageUrl ?? "")}`}
              alt={active.title ?? "Proyecto"}
              className="w-full h-full object-cover"
            />
            {active.images.length > 1 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 text-white text-sm px-2.5 py-1.5">
                <Images size={14} /> {active.images.length}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-bold text-brand-dark">{active.title || "Sin título"}</h3>
            {active.description && (
              <p className="text-base text-brand-dark mt-3 leading-relaxed line-clamp-4">
                {active.description}
              </p>
            )}

            {active.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm border border-gray-200 rounded-full px-3.5 py-1.5 text-brand-dark"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-8 mt-4">
              {(active.costMin || active.costMax) && (
                <div>
                  <p className="text-sm text-brand-gray">Costo del proyecto</p>
                  <p className="text-lg font-bold text-brand-dark">
                    ${(active.costMin ?? active.costMax)!.toLocaleString("es-AR")}
                    {active.costMax && active.costMin !== active.costMax ? `-$${active.costMax.toLocaleString("es-AR")}` : ""} ARS
                  </p>
                </div>
              )}
              {(active.durationMin || active.durationMax) && (
                <div>
                  <p className="text-sm text-brand-gray">Duración del proyecto</p>
                  <p className="text-lg font-bold text-brand-dark">
                    {active.durationMin ?? active.durationMax}
                    {active.durationMax && active.durationMin !== active.durationMax ? `-${active.durationMax}` : ""} días
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {items.length > 1 && (
          <div className="hidden sm:flex flex-col gap-5 w-56 shrink-0">
            {thumbItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`aspect-video rounded-xl overflow-hidden bg-brand-bg border-2 transition-colors ${
                  activeIndex === i ? "border-brand-dark" : "border-transparent hover:border-gray-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
                  alt={item.title ?? "Proyecto"}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {extraCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveIndex(2)}
                className="aspect-video rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-0.5 hover:bg-brand-bg transition-colors"
              >
                <span className="text-base font-bold text-brand-dark">+{extraCount}</span>
                <span className="text-xs text-brand-gray">Proyectos</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
