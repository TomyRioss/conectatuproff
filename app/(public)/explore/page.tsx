import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
import { NearbyProfessionals } from "@/components/explore/NearbyProfessionals";
import { getSuggestedServices, getTopCategoriesWithServices } from "@/lib/explore";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [suggestedServices, topCategories] = await Promise.all([
    getSuggestedServices(),
    getTopCategoriesWithServices(),
  ]);

  const allServiceIds = [
    ...suggestedServices.map((s) => s.id),
    ...topCategories.flatMap((c) => c.services.map((s) => s.id)),
  ];

  const favoritedServiceIds = userId
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { userId, serviceId: { in: allServiceIds } },
            select: { serviceId: true },
          })
        ).map((f) => f.serviceId)
      )
    : new Set<string | null>();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-brand-dark">
            Explorar
          </h1>
        </div>

        <NearbyProfessionals />

        {suggestedServices.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-brand-dark mb-6">
              Servicios que te pueden gustar
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {suggestedServices.map((service) => (
                <div key={service.id} className="flex-none w-[calc(25%-18px)] min-w-[260px] snap-start">
                  <ServiceCard
                    service={service}
                    handle={service.professional.user.username ?? ""}
                    initialFavorited={favoritedServiceIds.has(service.id)}
                    isPro={service.professional.isPro}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {topCategories.map(({ category, services }) => (
          <section key={category.id} className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-brand-dark mb-6">
              Servicios en {category.name}
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {services.map((service) => (
                <div key={service.id} className="flex-none w-[calc(25%-18px)] min-w-[260px] snap-start">
                  <ServiceCard
                    service={service}
                    handle={service.professional.user.username ?? ""}
                    initialFavorited={favoritedServiceIds.has(service.id)}
                    isPro={service.professional.isPro}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
