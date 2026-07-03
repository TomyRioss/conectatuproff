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
      select: { specialty: true, phone: true, dni: true, dniPhotoFront: true, dniPhotoBack: true },
    }),
  ]);

  const phone = pro?.phone ?? client?.phone ?? null;
  let initialStep = 0;
  if (pro?.dniPhotoFront) initialStep = 4;
  else if (pro?.dni) initialStep = 3;
  else if (phone) initialStep = 2;
  else if (pro?.specialty) initialStep = 1;

  return <OnboardingWizard initialPhone={phone} initialSpecialty={pro?.specialty ?? null} initialStep={initialStep} />;
}
