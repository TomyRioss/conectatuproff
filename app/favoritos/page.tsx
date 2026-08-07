import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
import { RemoveFavoriteMenu } from "@/components/profesionales/RemoveFavoriteMenu";
import { ProfCard, type ProfCardData } from "@/components/home/ProfCard";

export default async function FavoritosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      professional: {
        include: {
          user: { select: { username: true, image: true } },
          _count: { select: { reviews: true } },
        },
      },
      service: { include: { professional: { include: { user: { select: { username: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const professionals = favorites.filter((f) => f.professional).map((f) => f.professional!);
  const services = favorites.filter((f) => f.service).map((f) => f.service!);

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-bold text-brand-dark">Mis favoritos</h1>
        <p className="text-brand-gray mt-2 max-w-xl">
          Encontrá acá a los profesionales y servicios que guardaste para más adelante.
        </p>

        {professionals.length === 0 && services.length === 0 && (
          <p className="text-brand-gray mt-8">Todavía no agregaste favoritos.</p>
        )}

        {professionals.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Profesionales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {professionals.map((pro) => {
                const avatarSrc = pro.avatarUrl
                  ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`
                  : pro.user.image;
                const data: ProfCardData = {
                  slug: pro.user.username ?? "",
                  name: `${pro.firstName} ${pro.lastName}`,
                  specialty: pro.specialty ?? "",
                  zone: pro.location ?? "",
                  rating: pro.rating,
                  reviews: pro._count.reviews,
                  priceFrom: null,
                  premium: pro.isPro,
                  verified: pro.isVerified,
                  initials: `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase(),
                  color: "#6C5CE7",
                  avatarSrc,
                };
                return (
                  <div key={pro.id} className="relative">
                    <ProfCard pro={data} />
                    <div className="absolute top-4 right-4">
                      <RemoveFavoriteMenu type="profesional" id={pro.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-brand-dark mb-3">Servicios</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  handle={service.professional.user.username ?? ""}
                  initialFavorited
                  isPro={service.professional.isPro}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
