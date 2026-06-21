import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { error } = await requireOwner();
  if (error) return error;

  const { subId } = await params;
  const { name, imageUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const sub = await prisma.subcategory.update({
      where: { id: subId },
      data: { name: name.trim(), slug, ...(imageUrl !== undefined ? { imageUrl } : {}) },
    });
    return NextResponse.json(sub);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 409 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { error } = await requireOwner();
  if (error) return error;

  const { subId } = await params;
  await prisma.subcategory.delete({ where: { id: subId } });
  return NextResponse.json({ ok: true });
}
