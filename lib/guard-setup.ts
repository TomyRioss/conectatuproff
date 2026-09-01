import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Google users start without username/password. Until they finish the
// completion step, bounce every authenticated area to /register/completar.
export async function guardProfileSetup() {
  const session = await auth();
  if (session?.user?.needsSetup) redirect("/register/completar");
}
