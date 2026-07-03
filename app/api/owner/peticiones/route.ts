import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const peticiones = await prisma.petition.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(peticiones);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  if (status !== "RESOLVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  try {
    await prisma.petition.update({
      where: { id },
      data: { status, resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/owner/peticiones", e);
    return NextResponse.json({ error: "Error al actualizar petición" }, { status: 500 });
  }
}
