import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CompactProfileHeader } from "@/components/profesionales/CompactProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { ReviewsList } from "@/components/profesionales/ReviewsList";
import { AgendaSummary } from "@/components/profesionales/AgendaSummary";
import { FormacionManageSection } from "@/components/profesionales/FormacionManageSection";
import { PortfolioManageSection } from "@/components/profesionales/PortfolioManageSection";

export default async function ProfesionalDashboardPerfilPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pro = await prisma.professional.findFirst({
    where: { user: { username } },
    include: {
      user: { select: { id: true, email: true, username: true } },
      reviews: {
        include: { client: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      },
      availability: { orderBy: { dayOfWeek: "asc" } },
      blockedSlots: { where: { endAt: { gte: new Date() } }, orderBy: { startAt: "asc" } },
    },
  });

  if (!pro) notFound();
  if (pro.user.id !== session.user.id) redirect(`/perfil/profesional/${username}`);

  return (
    <main className="min-h-screen bg-white">
      <CompactProfileHeader
        username={username}
        firstName={pro.firstName}
        lastName={pro.lastName}
        specialty={pro.specialty}
        location={pro.location}
        phone={pro.phone}
        email={pro.user.email}
        avatarUrl={pro.avatarUrl}
        bio={pro.bio}
      />
      {pro.bio && (
        <div className="w-full px-6 sm:px-10">
          <h2 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">
            Acerca de
          </h2>
          <p className="text-brand-dark text-sm leading-relaxed whitespace-pre-line">{pro.bio}</p>
        </div>
      )}

      {/* Flowing content — sections separated by rules, no boxed cards */}
      <div className="w-full px-6 sm:px-10 pb-16">
        <div className="py-8 max-w-xl">
          <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} isOwner />
        </div>

        <div className="py-8 border-t border-gray-100">
          <FormacionManageSection />
        </div>

        <div className="py-8 border-t border-gray-100">
          <PortfolioManageSection />
        </div>

        <div className="py-8 border-t border-gray-100">
          <h2 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-4">
            Agenda
          </h2>
          <AgendaSummary availability={pro.availability} blockedSlots={pro.blockedSlots} />
        </div>

        <div className="py-8 border-t border-gray-100">
          <h2 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-4">
            Reseñas
          </h2>
          <ReviewsList reviews={pro.reviews} />
        </div>

        <div className="py-8 border-t border-gray-100">
          <h2 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">
            Mensajes
          </h2>
          <p className="text-sm text-brand-gray">Próximamente.</p>
        </div>
      </div>
    </main>
  );
}
