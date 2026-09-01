import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
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
  const status = req.nextUrl.searchParams.get("status") ?? "active";

  const where: Prisma.UserWhereInput = {};
  if (roleParam) {
    const roles = ROLE_MAP[roleParam];
    if (!roles) return NextResponse.json({ error: "role inválido" }, { status: 400 });
    where.role = { in: roles };
  }
  if (status === "archived") where.isActive = false;
  else if (status === "active") where.isActive = true;

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      isActive: true,
      isBanned: true,
      createdAt: true,
      role: true,
      client: { select: { firstName: true, lastName: true } },
      professional: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = users.map(({ client, professional, ...u }) => {
    const profile = professional ?? client;
    const name = u.name ?? (profile ? `${profile.firstName} ${profile.lastName}` : null);
    return { ...u, name };
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const isSelf = body.id === session!.user.id;
  const data: Prisma.UserUpdateInput = {};

  if (typeof body.name === "string") data.name = body.name.trim() || null;
  if (typeof body.username === "string") data.username = body.username.trim() || null;
  if (typeof body.email === "string") {
    const email = body.email.trim();
    if (!email) return NextResponse.json({ error: "email requerido" }, { status: 400 });
    data.email = email;
  }
  if (typeof body.isBanned === "boolean") data.isBanned = body.isBanned;
  if (typeof body.isActive === "boolean") {
    if (isSelf && !body.isActive) {
      return NextResponse.json({ error: "No podés archivar tu propia cuenta" }, { status: 400 });
    }
    data.isActive = body.isActive;
  }
  // El rol es inmutable desde este endpoint — se ignora aunque venga en el body.

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nada para actualizar" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email o username ya en uso" }, { status: 409 });
    }
    console.error("PATCH /api/owner/usuarios", e);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  if (body.id === session!.user.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: body.id },
    select: { isActive: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.isActive) {
    return NextResponse.json(
      { error: "Archivá el usuario antes de eliminarlo definitivamente" },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/owner/usuarios", e);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
