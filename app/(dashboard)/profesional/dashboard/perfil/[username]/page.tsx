import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CompactProfileHeader } from "@/components/profesionales/CompactProfileHeader";
import { IntroVideo } from "@/components/profesionales/IntroVideo";
import { FormacionManageSection } from "@/components/profesionales/FormacionManageSection";
import { PortfolioManageSection } from "@/components/profesionales/PortfolioManageSection";
import { AboutEditSection } from "@/components/profesionales/AboutEditSection";
import AgendaCitasPanel from "@/components/agenda/AgendaCitasPanel";
import { CalendarAdminNotice } from "@/components/agenda/CalendarAdminNotice";
import { CalendarCheck } from "lucide-react";

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
      user: { select: { id: true, email: true, username: true, image: true } },
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
        userImage={pro.user.image}
        bio={pro.bio}
        isPro={pro.isPro}
      />
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-10">
        <AboutEditSection bio={pro.bio} />
      </div>

      <div className="mt-6 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-16 flex flex-col gap-6">
        <PortfolioManageSection />

        <IntroVideo name={pro.firstName} videoUrl={pro.videoUrl} isOwner />

        <div className="border-t border-gray-100 pt-8">
          <FormacionManageSection />
        </div>

        <div id="mis-citas" className="border-t border-gray-100 pt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-dark font-display mb-4">
            <CalendarCheck size={18} className="text-brand-violet" />
            Recordá administrar tus citas con tus clientes!
          </h2>
          <CalendarAdminNotice />
          <AgendaCitasPanel />
        </div>
      </div>
    </main>
  );
}
