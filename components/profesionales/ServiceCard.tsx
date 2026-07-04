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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      {service.imageUrl && (
        <div className="relative h-40 bg-brand-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-brand-dark">{service.title}</h4>
        {service.durationMin && (
          <p className="text-xs text-brand-gray flex items-center gap-1 mt-0.5">
            <Clock size={12} /> {service.durationMin} min
          </p>
        )}

        {service.description && (
          <p className="text-sm text-brand-gray mt-2 line-clamp-2">{service.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4">
          <div>
            <p className="font-bold text-brand-violet">
              {price.toLocaleString("es-AR", { style: "currency", currency: service.currency })}
            </p>
            <p className="text-[10px] uppercase text-brand-gray">por sesión</p>
          </div>
          <button type="button" className="text-sm text-brand-violet font-medium">
            Ver detalle
          </button>
        </div>

        <button
          type="button"
          className="w-full bg-brand-green text-white text-sm font-medium rounded-full py-2 hover:opacity-90 transition-opacity mt-3"
        >
          Reservar este tratamiento
        </button>
      </div>
    </div>
  );
}
