import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

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

  const { id, status, categoryId } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  if (status !== "RESOLVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  try {
    if (status === "REJECTED" || !categoryId) {
      await prisma.petition.update({
        where: { id },
        data: { status, resolvedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    const petition = await prisma.petition.findUnique({ where: { id } });
    if (!petition) return NextResponse.json({ error: "Petición no encontrada" }, { status: 404 });
    if (petition.status !== "PENDING") {
      return NextResponse.json({ error: "Petición ya resuelta" }, { status: 409 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

    const name = petition.name.trim();
    const dupe = await prisma.subcategory.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (dupe) return NextResponse.json({ error: "Ya existe esa subcategoría" }, { status: 409 });

    const slug = slugify(name, { lower: true, strict: true });
    await prisma.$transaction([
      prisma.subcategory.create({
        data: { name, slug, categoryId },
      }),
      prisma.petition.update({
        where: { id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    console.error("PATCH /api/owner/peticiones", e);
    return NextResponse.json({ error: "Error al actualizar petición" }, { status: 500 });
  }
}
