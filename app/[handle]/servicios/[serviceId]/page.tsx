import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/profesionales/FavoriteButton";
import { ServiceGallery } from "@/components/profesionales/ServiceGallery";
import { ProBadge } from "@/components/ui/ProBadge";
import { ReviewsList } from "@/components/profesionales/ReviewsList";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ handle: string; serviceId: string }>;
}) {
  const { handle, serviceId } = await params;
  const username = handle.replace(/^@/, "");

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      gallery: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      sessionPackages: true,
      professional: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          specialty: true,
          location: true,
          isPro: true,
          user: { select: { username: true, image: true } },
          reviews: {
            orderBy: { createdAt: "desc" },
            include: { client: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });

  if (!service || service.professional.user.username !== username) notFound();

  const pro = service.professional;
  const fullName = `${pro.firstName} ${pro.lastName}`;
  const initials = `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase();
  const avatarSrc = pro.avatarUrl ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}` : pro.user.image;
  const reviewCount = pro.reviews.length;
  const avgRating = reviewCount > 0 ? pro.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const price = service.price ? Number(service.price.toString()) : 0;
  const unit = service.serviceType === "CLASE" ? "clase" : "sesión";

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">{service.title}</h1>

          <Link
            href={`/perfil/profesional/${username}`}
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-brand-violet/40 transition-colors"
          >
            <Avatar className="h-14 w-14">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} />}
              <AvatarFallback className="bg-brand-violet text-white text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-brand-dark">{fullName}</p>
                {pro.isPro && <ProBadge />}
              </div>
              {pro.specialty && <p className="text-sm text-brand-gray">{pro.specialty}</p>}
              <div className="flex items-center gap-3 mt-0.5 text-sm text-brand-gray flex-wrap">
                {reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-brand-dark">{avgRating.toFixed(1)}</span> ({reviewCount})
                  </span>
                )}
                {pro.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {pro.location}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <ServiceGallery
            images={[
              ...(service.imageUrl ? [service.imageUrl] : []),
              ...service.gallery.map((g) => g.imageUrl).filter((k) => k !== service.imageUrl),
            ]}
            title={service.title}
          />

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Acerca de este servicio</h2>
            {service.durationMin && (
              <p className="text-sm text-brand-gray flex items-center gap-1 mb-3">
                <Clock size={14} /> {service.durationMin} min por {unit}
              </p>
            )}
            {service.description && (
              <p className="text-brand-dark text-sm leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            )}
          </div>

          {service.faqs.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-3">FAQ</h2>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                {service.faqs.map((faq) => (
                  <details key={faq.id} className="group p-4">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between font-semibold text-brand-dark text-sm w-full">
                      {faq.question}
                      <span className="text-brand-gray transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <p className="text-sm text-brand-gray mt-2 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Reseñas</h2>
            <ReviewsList reviews={pro.reviews} />
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-brand-violet">
                  {price.toLocaleString("es-AR", { style: "currency", currency: service.currency })}
                </p>
                <p className="text-xs uppercase text-brand-gray">por {unit}</p>
              </div>
              <FavoriteButton type="servicio" id={service.id} initialFavorited={false} />
            </div>

            <Link
              href={`/perfil/profesional/${username}/agendar?service=${service.id}`}
              className="block w-full text-center bg-brand-green text-white text-sm font-semibold rounded-full py-2.5 hover:opacity-90 transition-opacity mt-4"
            >
              Agendar
            </Link>

            {service.sessionPackages.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                <p className="text-sm font-bold text-brand-dark">Planes disponibles</p>
                {service.sessionPackages.map((sp) => (
                  <div key={sp.id} className="rounded-xl border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-brand-dark">{sp.sessionCount} sesiones</p>
                    <p className="text-sm text-brand-violet font-bold mt-0.5">
                      {Number(sp.price.toString()).toLocaleString("es-AR", { style: "currency", currency: service.currency })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
