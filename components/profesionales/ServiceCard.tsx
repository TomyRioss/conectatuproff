import { Clock } from "lucide-react";

type ServiceCardProps = {
  service: {
    id: string;
    title: string;
    description: string | null;
    price: { toString(): string };
    currency: string;
    durationMin: number | null;
    imageUrl: string | null;
  };
};

const RESULT_LABELS = ["Antes", "Después", "Resultado"];

export function ServiceCard({ service }: ServiceCardProps) {
  const price = Number(service.price.toString());

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-brand-dark">{service.title}</h4>
          {service.durationMin && (
            <p className="text-xs text-brand-gray flex items-center gap-1 mt-0.5">
              <Clock size={12} /> {service.durationMin} min
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-brand-violet">
            {price.toLocaleString("es-AR", { style: "currency", currency: service.currency })}
          </p>
          <p className="text-[10px] uppercase text-brand-gray">por sesión</p>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-brand-gray mt-2">{service.description}</p>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray mt-3 mb-2">
        Resultados · Antes y después
      </p>
      <div className="grid grid-cols-3 gap-2">
        {RESULT_LABELS.map((label, i) => (
          <div
            key={label}
            className="relative aspect-square rounded-lg overflow-hidden bg-brand-bg border border-gray-200"
          >
            {i === 0 && service.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.imageUrl} alt={label} className="h-full w-full object-cover" />
            ) : null}
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          className="flex-1 bg-brand-green text-white text-sm font-medium rounded-full py-2 hover:opacity-90 transition-opacity"
        >
          Reservar este tratamiento
        </button>
        <button type="button" className="text-sm text-brand-violet font-medium">
          Ver detalle
        </button>
      </div>
    </div>
  );
}
