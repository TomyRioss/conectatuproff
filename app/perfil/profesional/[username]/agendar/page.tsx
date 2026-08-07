import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { BookingWizard } from "@/components/agendar/BookingWizard";
import { ProfessionalBlockedModal } from "@/components/agendar/ProfessionalBlockedModal";

export const dynamic = "force-dynamic";

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { username: rawUsername } = await params;
  const { service: preselectedServiceId } = await searchParams;
  const username = rawUsername.replace(/^@/, "");

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/perfil/profesional/${username}/agendar`);
  }
  if ((session.user as { role?: string }).role !== "CLIENT") {
    return (
      <main className="min-h-screen bg-brand-bg pb-20">
        <ProfessionalBlockedModal username={username} />
      </main>
    );
  }

  const pro = await prisma.professional.findFirst({
    where: { isActive: true, user: { username } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialty: true,
      location: true,
      avatarUrl: true,
      user: { select: { image: true } },
      services: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, price: true, currency: true, durationMin: true, serviceType: true },
      },
    },
  });

  if (!pro) notFound();

  const avatarSrc = pro.avatarUrl ? `/api/avatar?key=${encodeURIComponent(pro.avatarUrl)}` : pro.user.image;

  return (
    <main className="min-h-screen bg-brand-bg pb-20">
      <BookingWizard
        username={username}
        professional={{
          id: pro.id,
          name: `${pro.firstName} ${pro.lastName}`,
          specialty: pro.specialty,
          location: pro.location,
          avatarSrc,
        }}
        services={pro.services.map((s) => ({
          ...s,
          price: s.price ? s.price.toString() : null,
        }))}
        initialServiceId={preselectedServiceId}
      />
    </main>
  );
}
