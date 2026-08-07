import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { ProBadge } from "@/components/ui/ProBadge";

type ServiceCardProps = {
  service: {
    id: string;
    title: string;
    description: string | null;
    price: { toString(): string } | null;
    currency: string;
    durationMin: number | null;
    imageUrl: string | null;
    serviceType?: string | null;
  };
  handle: string;
  initialFavorited?: boolean;
  isPro?: boolean;
};

export function ServiceCard({ service, handle, initialFavorited = false, isPro = false }: ServiceCardProps) {
  const price = service.price ? Number(service.price.toString()) : 0;
  const detailHref = `/${handle}/servicios/${service.id}`;
  const unit = service.serviceType === "CLASE" ? "clase" : "sesión";

  return (
    <div
      className={`bg-white rounded-lg overflow-hidden flex flex-col relative ${
        isPro ? "border-2 border-brand-violet/40 shadow-sm" : "border border-gray-200"
      }`}
    >
      {isPro && (
        <div className="absolute top-2 left-2 z-10">
          <ProBadge />
        </div>
      )}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton type="servicio" id={service.id} initialFavorited={initialFavorited} className="bg-white" />
      </div>

      {service.imageUrl ? (
        <Link href={detailHref} className="relative h-40 bg-brand-bg block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </Link>
      ) : (
        <Link
          href={detailHref}
          className="relative h-40 flex items-center justify-center bg-gradient-to-br from-brand-violet/15 via-brand-bg to-brand-green/10 block"
        >
          <Sparkles className="text-brand-violet/40" size={40} strokeWidth={1.5} />
        </Link>
      )}

      <div className="p-4 flex flex-col flex-1">
        <Link href={detailHref} className="font-semibold text-brand-dark hover:text-brand-violet transition-colors">
          {service.title}
        </Link>
        {service.durationMin && (
          <p className="text-xs text-brand-gray flex items-center gap-1 mt-0.5">
            <Clock size={12} /> {service.durationMin} min/{unit}
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
            <p className="text-[10px] uppercase text-brand-gray">por {unit}</p>
          </div>
          <Link href={detailHref} className="text-sm text-brand-violet font-medium hover:underline">
            Ver detalle
          </Link>
        </div>

        <Link
          href={`/perfil/profesional/${handle}/agendar?service=${service.id}`}
          className="block w-full text-center bg-brand-green text-white text-sm font-medium rounded-full py-2 hover:opacity-90 transition-opacity mt-3"
        >
          Agendar
        </Link>
      </div>
    </div>
  );
}
