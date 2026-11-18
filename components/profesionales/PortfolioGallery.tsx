import { PortfolioMedia } from "@/components/profesionales/PortfolioMedia";

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

function formatRange(min: number | null, max: number | null, format: (value: number) => string) {
  if (min == null && max == null) return null;
  if (min == null) return format(max!);
  if (max == null || max === min) return format(min);
  return `${format(min)}-${format(max)}`;
}

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
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
            <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="relative aspect-video bg-gray-100">
                <PortfolioMedia
                  mediaKey={mediaKey}
                  alt={item.title || "Trabajo realizado"}
                  className="absolute inset-0"
                />
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
    </section>
  );
}
