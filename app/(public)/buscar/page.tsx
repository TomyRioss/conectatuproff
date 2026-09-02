import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import type { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{
    barrio?: string;
    servicio?: string;
    categoria?: string;
    precioMin?: string;
    precioMax?: string;
    sort?: string;
  }>;
}) {
  const { barrio, servicio, categoria, precioMin, precioMax, sort = "relevancia" } = await searchParams;

  // `categoria` puede ser slug de Category (padre) o de Subcategory. Los links de
  // subcategoría en el home mandan el slug de la subcategoría, pero Service solo
  // linkea a Category. Subcategoría ↔ profesional se resuelve por specialty (igual
  // que CategoriesSection). ponytail: match por nombre, no hay professional.subcategoryId poblado.
  const sub = categoria
    ? await prisma.subcategory.findUnique({ where: { slug: categoria }, select: { name: true } })
    : null;

  const where: Prisma.ServiceWhereInput = {
    status: "ACTIVE",
    ...(barrio ? { professional: { location: { contains: barrio, mode: "insensitive" } } } : {}),
    ...(servicio
      ? {
          OR: [
            { title: { contains: servicio, mode: "insensitive" } },
            { description: { contains: servicio, mode: "insensitive" } },
            { professional: { specialty: { contains: servicio, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(categoria
      ? sub
        ? { AND: [{ professional: { specialty: { equals: sub.name, mode: "insensitive" } } }] }
        : { category: { slug: categoria } }
      : {}),
    // Validar numéricos: un precioMin no numérico generaría NaN y un 500 de Prisma.
    ...(() => {
      const min = precioMin ? Number(precioMin) : NaN;
      const max = precioMax ? Number(precioMax) : NaN;
      if (!Number.isFinite(min) && !Number.isFinite(max)) return {};
      return {
        price: {
          ...(Number.isFinite(min) && min >= 0 ? { gte: min } : {}),
          ...(Number.isFinite(max) && max >= 0 ? { lte: max } : {}),
        },
      };
    })(),
  };

  const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [
    { professional: { isPro: "desc" } },
    sort === "precio_asc" ? { price: "asc" } : sort === "precio_desc" ? { price: "desc" } : { createdAt: "desc" },
  ];

  const session = await auth();
  const userId = session?.user?.id;

  const services = await prisma.service.findMany({
    where,
    orderBy,
    include: { professional: { include: { user: { select: { username: true } } } }, category: true },
  });

  const favoritedServiceIds = userId
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { userId, serviceId: { in: services.map((s) => s.id) } },
            select: { serviceId: true },
          })
        ).map((f) => f.serviceId)
      )
    : new Set<string | null>();

  const grouped = new Map<string, { name: string; services: typeof services }>();
  for (const service of services) {
    if (!service.category) continue;
    const key = service.category.id;
    if (!grouped.has(key)) grouped.set(key, { name: service.category.name, services: [] });
    grouped.get(key)!.services.push(service);
  }

  const title =
    servicio && barrio
      ? `Servicios de ${servicio} en ${barrio}`
      : servicio
        ? `Servicios de ${servicio}`
        : barrio
          ? `Servicios en ${barrio}`
          : "Resultados de búsqueda";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-bg pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-brand-dark">
            {title}
          </h1>
          <div className="mt-6">
            <SearchFilters resultCount={services.length} />
          </div>

          {services.length === 0 ? (
            <p className="text-brand-gray mt-10">
              No encontramos profesionales{barrio ? ` en ${barrio}` : ""}. Probá con otra zona.
            </p>
          ) : (
            Array.from(grouped.values()).map((group) => (
              <section key={group.name} className="mt-10">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-brand-dark mb-6">
                  {group.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      handle={service.professional.user.username ?? ""}
                      initialFavorited={favoritedServiceIds.has(service.id)}
                      isPro={service.professional.isPro}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
