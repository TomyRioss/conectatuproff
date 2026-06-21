import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireOwner() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "OWNER" && role !== "SUPER_ADMIN")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}
