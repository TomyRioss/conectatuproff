import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const professional = await prisma.professional.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!professional) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.professional.update({ where: { id }, data: { isVerified: true } }),
      prisma.user.update({ where: { id: professional.userId }, data: { isActive: true } }),
    ]);
  } else {
    await prisma.user.update({
      where: { id: professional.userId },
      data: { isBanned: true, isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
