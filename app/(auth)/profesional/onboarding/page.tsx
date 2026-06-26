import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function ProfesionalOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    select: { phone: true },
  });

  const phone = client?.phone ?? null;
  const initialStep = phone ? 1 : 0;

  return <OnboardingWizard initialPhone={phone} initialStep={initialStep} />;
}
