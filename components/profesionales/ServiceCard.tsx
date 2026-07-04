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

      {service.imageUrl && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-brand-bg border border-gray-200 mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

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
