import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { isVerified: true },
  });

  const state = !pro ? "none" : pro.isVerified ? "verified" : "pending";
  return NextResponse.json({ state });
}
