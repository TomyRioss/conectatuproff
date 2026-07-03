import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { ProfileHeader } from "@/components/profesionales/ProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { AboutSection } from "@/components/profesionales/AboutSection";
import { FormacionSection } from "@/components/profesionales/FormacionSection";
import { ServiceCard } from "@/components/profesionales/ServiceCard";
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
      subcategory: true,
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      portfolio: { orderBy: { order: "asc" } },
      reviews: true,
    },
  });

  if (!pro) notFound();

  const reviewCount = pro.reviews.length;
  const avgRating =
    reviewCount > 0
      ? pro.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : pro.rating;

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <Navbar />
      <ProfileHeader pro={pro} avgRating={avgRating} reviewCount={reviewCount} />

      <div className="max-w-2xl mx-auto px-4 space-y-6 mt-6">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-2/5">
            <AboutSection bio={pro.bio} />
          </div>
          <div className="md:w-3/5">
            <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} />
          </div>
        </div>
        <FormacionSection />

        {pro.services.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
              Servicios
            </h2>
            <h3 className="text-xl font-bold text-brand-dark mb-4">
              Tratamientos disponibles
            </h3>
            <div className="space-y-4">
              {pro.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ChatWidget name={pro.firstName} />
      <StickyBookingCTA />
    </main>
  );
}
