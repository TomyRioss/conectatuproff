import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { Role } from "@/lib/generated/prisma/client";

const ROLE_MAP: Record<string, Role[]> = {
  CLIENT: ["CLIENT"],
  PROFESSIONAL: ["PROFESSIONAL"],
  ADMIN: ["ADMIN", "OWNER", "SUPER_ADMIN"],
};

export async function GET(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const roleParam = req.nextUrl.searchParams.get("role");
  const roles = roleParam ? ROLE_MAP[roleParam] : null;
  if (!roles) {
    return NextResponse.json({ error: "role inválido" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      isActive: true,
      isBanned: true,
      createdAt: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
