import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profesionales/ProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { AboutSection } from "@/components/profesionales/AboutSection";
import { FormacionSection } from "@/components/profesionales/FormacionSection";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
import { PackageCard } from "@/components/profesionales/PackageCard";
import { ContactCard } from "@/components/profesionales/ContactCard";
import { PortfolioSection } from "@/components/profesionales/PortfolioSection";

export default async function ProfesionalProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, "");

  const pro = await prisma.professional.findFirst({
    where: { isActive: true, user: { username } },
    include: {
      user: { select: { image: true } },
      subcategory: true,
      services: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } },
      packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      portfolio: { orderBy: { order: "asc" }, include: { images: { orderBy: { order: "asc" } } } },
      reviews: true,
      _count: { select: { educations: true, certifications: true } },
    },
  });

  if (!pro) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const [isFavorited, favoritedServiceIds] = userId
    ? await Promise.all([
        prisma.favorite.findUnique({
          where: { userId_professionalId: { userId, professionalId: pro.id } },
        }).then(Boolean),
        prisma.favorite.findMany({
          where: { userId, serviceId: { in: pro.services.map((s) => s.id) } },
          select: { serviceId: true },
        }).then((rows) => new Set(rows.map((r) => r.serviceId))),
      ])
    : [false, new Set<string | null>()];

  const avatarSrc = pro.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}`
    : pro.user.image;

  const reviewCount = pro.reviews.length;
  const avgRating =
    reviewCount > 0
      ? pro.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : pro.rating;

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <ProfileHeader pro={pro} username={username} avatarSrc={avatarSrc} avgRating={avgRating} reviewCount={reviewCount} />
          <AboutSection bio={pro.bio} />
          <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} />
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <ContactCard
            name={`${pro.firstName} ${pro.lastName}`}
            specialty={pro.specialty ?? pro.subcategory?.name ?? null}
            avatarSrc={avatarSrc}
            professionalId={pro.id}
            initialFavorited={isFavorited}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {pro.services.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
              Servicios
            </h2>
            <h3 className="text-xl font-bold text-brand-dark mb-4">
              Servicios disponibles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pro.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={{
                    ...service,
                    price: service.price?.toString() ?? null,
                  }}
                  handle={username}
                  initialFavorited={favoritedServiceIds.has(service.id)}
                />
              ))}
            </div>
          </section>
        )}

        <PortfolioSection items={pro.portfolio} handle={username} />

        <FormacionSection
          username={username}
          educationCount={pro._count.educations}
          certificationCount={pro._count.certifications}
        />

        {pro.packages.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
              Paquetes
            </h2>
            <h3 className="text-xl font-bold text-brand-dark mb-4">
              Packs de sesiones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pro.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={{ ...pkg, price: pkg.price.toString(), originalPrice: pkg.originalPrice.toString() }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
