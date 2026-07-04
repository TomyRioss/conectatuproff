import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { ProfileHeader } from "@/components/profesionales/ProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { AboutSection } from "@/components/profesionales/AboutSection";
import { FormacionSection } from "@/components/profesionales/FormacionSection";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
import { PackageCard } from "@/components/profesionales/PackageCard";
import { ChatWidget } from "@/components/profesionales/ChatWidget";
import { StickyBookingCTA } from "@/components/profesionales/StickyBookingCTA";

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
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      portfolio: { orderBy: { order: "asc" } },
      reviews: true,
      _count: { select: { educations: true, certifications: true } },
    },
  });

  if (!pro) notFound();

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
      <Navbar />
      <ProfileHeader pro={pro} avatarSrc={avatarSrc} avgRating={avgRating} reviewCount={reviewCount} />

      <div className="max-w-6xl mx-auto px-4 space-y-6 mt-6">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-2/5 flex flex-col justify-center">
            <AboutSection bio={pro.bio} />
          </div>
          <div className="md:w-3/5">
            <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} />
          </div>
        </div>
        <FormacionSection
          username={username}
          educationCount={pro._count.educations}
          certificationCount={pro._count.certifications}
        />
      </div>

      {pro.services.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-6">
          <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
            Servicios
          </h2>
          <h3 className="text-xl font-bold text-brand-dark mb-4">
            Tratamientos disponibles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pro.services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {pro.packages.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-6">
          <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
            Paquetes
          </h2>
          <h3 className="text-xl font-bold text-brand-dark mb-4">
            Packs de sesiones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pro.packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>
      )}

      <ChatWidget name={pro.firstName} />
      <StickyBookingCTA />
    </main>
  );
}
