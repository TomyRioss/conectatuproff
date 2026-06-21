import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  const { name, imageUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug, ...(imageUrl !== undefined ? { imageUrl } : {}) },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
