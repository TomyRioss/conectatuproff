import Link from "next/link";
import { Pencil } from "lucide-react";

type Item = {
  id: string;
  title: string | null;
  description: string | null;
  costMin: number | null;
  costMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  images: { imageUrl: string }[];
};

export function PortfolioGalleryCard({
  item,
  handle,
  isOwner,
}: {
  item: Item;
  handle: string;
  isOwner: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-200 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
          alt={item.title ?? "Proyecto"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {isOwner && (
          <Link
            href={`/${handle}/portfolio/edit/${item.id}`}
            aria-label="Editar proyecto"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-brand-gray hover:text-brand-dark"
          >
            <Pencil size={14} />
          </Link>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-brand-dark text-sm leading-snug">{item.title || "Sin título"}</h3>

        {item.description && (
          <p className="text-brand-gray text-xs line-clamp-2">{item.description}</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between text-sm">
          {(item.costMin || item.costMax) && (
            <span className="font-bold text-brand-dark">
              ${item.costMin ?? item.costMax}{item.costMax && item.costMin !== item.costMax ? `-${item.costMax}` : ""}
            </span>
          )}
          {(item.durationMin || item.durationMax) && (
            <span className="text-brand-gray text-xs">
              {item.durationMin ?? item.durationMax}{item.durationMax && item.durationMin !== item.durationMax ? `-${item.durationMax}` : ""} días
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
