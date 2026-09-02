import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function ProfesionalOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [client, pro] = await Promise.all([
    prisma.client.findUnique({ where: { userId: session.user.id }, select: { phone: true } }),
    prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { specialty: true, phone: true, location: true, isVerified: true },
    }),
  ]);

  // Pro ya activo: no repetir onboarding. Si la sesión no está en modo profesional
  // (ej. login con Google con perfil de cliente), evitar el rebote extra por el
  // layout profesional y mandar directo al home.
  if (pro?.isVerified) {
    redirect((session.user as { role?: string }).role === "PROFESSIONAL" ? "/profesional/perfil" : "/");
  }

  const phone = pro?.phone ?? client?.phone ?? null;
  let initialStep = 0;
  if (phone) initialStep = 2;
  else if (pro?.specialty) initialStep = 1;

  return <OnboardingWizard initialPhone={phone} initialSpecialty={pro?.specialty ?? null} initialStep={initialStep} />;
}
