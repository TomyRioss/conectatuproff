import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CompactProfileHeader } from "@/components/profesionales/CompactProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { FormacionManageSection } from "@/components/profesionales/FormacionManageSection";
import { PortfolioManageSection } from "@/components/profesionales/PortfolioManageSection";
import { AboutEditSection } from "@/components/profesionales/AboutEditSection";

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
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10">
        <AboutEditSection bio={pro.bio} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pb-16 flex flex-col gap-6">
        <div className="pt-6">
          <PortfolioManageSection username={username} />
        </div>

        <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} isOwner />

        <div className="border-t border-gray-100 pt-8">
          <FormacionManageSection />
        </div>
      </div>
    </main>
  );
}
