import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import slugify from "slugify";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const categories = await prisma.category.findMany({
    include: { subcategories: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const { name, imageUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const slug = slugify(name, { lower: true, strict: true });
  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), slug, ...(imageUrl ? { imageUrl } : {}) },
    });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
