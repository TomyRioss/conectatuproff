import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOwnUsername } from "@/lib/professional";

export default async function ProfesionalPerfilRedirect() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { hasProfessional, username } = await getOwnUsername(session.user.id);
  if (!hasProfessional) redirect("/profesional/onboarding");
  if (!username) redirect("/profesional/dashboard");

  redirect(`/profesional/dashboard/perfil/${username}`);
}
