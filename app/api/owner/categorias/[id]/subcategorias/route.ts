import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireOwner();
  if (error) return error;

  const { id: categoryId } = await params;
  const { name, imageUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const sub = await prisma.subcategory.create({
      data: { name: name.trim(), slug, categoryId, ...(imageUrl ? { imageUrl } : {}) },
    });
    return NextResponse.json(sub, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe esa subcategoría" }, { status: 409 });
  }
}
