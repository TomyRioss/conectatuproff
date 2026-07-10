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

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-dark mb-4">Portfolio</h2>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-full bg-white rounded-2xl border border-gray-200 p-5 flex flex-col md:flex-row gap-5"
          >
            <div className="md:w-2/5 aspect-video rounded-xl overflow-hidden bg-brand-bg shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(item.images[0]?.imageUrl ?? "")}`}
                alt={item.title ?? "Proyecto"}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              {item.startedAt && (
                <p className="text-sm text-brand-gray">Del: {formatMonthYear(item.startedAt)}</p>
              )}
              <h3 className="text-lg font-bold text-brand-dark mt-0.5">{item.title || "Sin título"}</h3>
              {item.description && (
                <p className="text-sm text-brand-dark mt-2 line-clamp-3">{item.description}</p>
              )}

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs border border-gray-200 rounded-full px-3 py-1 text-brand-dark"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-8 mt-4">
                {(item.costMin || item.costMax) && (
                  <div>
                    <p className="text-xs text-brand-gray">Costo del proyecto</p>
                    <p className="text-sm font-bold text-brand-dark">
                      ${item.costMin ?? item.costMax}
                      {item.costMax && item.costMin !== item.costMax ? `-$${item.costMax}` : ""}
                    </p>
                  </div>
                )}
                {(item.durationMin || item.durationMax) && (
                  <div>
                    <p className="text-xs text-brand-gray">Duración del proyecto</p>
                    <p className="text-sm font-bold text-brand-dark">
                      {item.durationMin ?? item.durationMax}
                      {item.durationMax && item.durationMin !== item.durationMax ? `-${item.durationMax}` : ""} días
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
