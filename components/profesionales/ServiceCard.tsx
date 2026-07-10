import Link from "next/link";
import { Clock } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";

type ServiceCardProps = {
  service: {
    id: string;
    title: string;
    description: string | null;
    price: { toString(): string } | null;
    currency: string;
    durationMin: number | null;
    imageUrl: string | null;
  };
  handle: string;
  initialFavorited?: boolean;
};

export function ServiceCard({ service, handle, initialFavorited = false }: ServiceCardProps) {
  const price = service.price ? Number(service.price.toString()) : 0;
  const detailHref = `/${handle}/servicios/${service.id}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col relative">
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton type="servicio" id={service.id} initialFavorited={initialFavorited} className="bg-white" />
      </div>

      {service.imageUrl && (
        <Link href={detailHref} className="relative h-40 bg-brand-bg block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </Link>
      )}

      <div className="p-4 flex flex-col flex-1">
        <Link href={detailHref} className="font-semibold text-brand-dark hover:text-brand-violet transition-colors">
          {service.title}
        </Link>
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
          <Link href={detailHref} className="text-sm text-brand-violet font-medium hover:underline">
            Ver detalle
          </Link>
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
