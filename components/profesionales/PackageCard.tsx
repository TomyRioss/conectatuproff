type PackageCardProps = {
  pkg: {
    id: string;
    name: string;
    description: string | null;
    sessionCount: number;
    price: { toString(): string };
    originalPrice: { toString(): string };
    currency: string;
    validityDays: number | null;
  };
};

export function PackageCard({ pkg }: PackageCardProps) {
  const price = Number(pkg.price.toString());
  const originalPrice = Number(pkg.originalPrice.toString());
  const discountPct =
    originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col">
      <h4 className="font-semibold text-brand-dark">{pkg.name}</h4>

      {pkg.description && (
        <p className="text-sm text-brand-gray mt-1 line-clamp-2">{pkg.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-dark">
          {pkg.sessionCount} sesiones
        </span>
        {pkg.validityDays && (
          <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-dark">
            Válido {pkg.validityDays} días
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 border-t border-gray-100 mt-3 pt-3">
        <span className="text-xl font-bold text-brand-violet">
          {price.toLocaleString("es-AR", { style: "currency", currency: pkg.currency })}
        </span>
        {discountPct !== null && (
          <>
            <span className="text-sm text-brand-gray line-through">
              {originalPrice.toLocaleString("es-AR", { style: "currency", currency: pkg.currency })}
            </span>
            <span className="ml-auto rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
              -{discountPct}%
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        className="w-full bg-brand-green text-white text-sm font-medium rounded-full py-2 hover:opacity-90 transition-opacity mt-3"
      >
        Comprar paquete
      </button>
    </div>
  );
}
