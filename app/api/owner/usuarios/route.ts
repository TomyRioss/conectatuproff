import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { Role } from "@/lib/generated/prisma/client";

const ADMIN_ROLES: Role[] = ["ADMIN", "OWNER", "SUPER_ADMIN"];

// El tab se define por el PERFIL que tiene el usuario, no por user.role: un pro
// registrado arrastra también una fila Client, y su role pudo quedar en CLIENT
// según cómo se creó. Filtrar por role dejaba pros fuera de "Profesionales" y
// mostraba "Sin usuarios" en "Clientes". Un usuario con ambos perfiles aparece
// en los dos tabs — refleja que tiene las dos cuentas.
function filterFor(tab: string): Prisma.UserWhereInput | null {
  switch (tab) {
    case "PROFESSIONAL":
      return { professional: { isNot: null } };
    case "CLIENT":
      // Todo el que tiene perfil de cliente (aunque además sea profesional).
      return { client: { isNot: null }, role: { notIn: ADMIN_ROLES } };
    case "ADMIN":
      return { role: { in: ADMIN_ROLES } };
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const roleParam = req.nextUrl.searchParams.get("role");
  const status = req.nextUrl.searchParams.get("status") ?? "active";

  const where: Prisma.UserWhereInput = {};
  if (roleParam) {
    const f = filterFor(roleParam);
    if (!f) return NextResponse.json({ error: "role inválido" }, { status: 400 });
    Object.assign(where, f);
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
    // Archivar = pre-baneo: además de bloquear el acceso (user.isActive), hay que
    // sacar al usuario de todas las vistas públicas y cancelar lo que quede pendiente.
    // Restaurar sólo revierte el acceso y el perfil; los turnos cancelados y los
    // servicios pausados no se auto-restauran (el profesional los reactiva a mano).
    if (data.isActive === false || data.isActive === true) {
      const target = await prisma.user.findUnique({
        where: { id: body.id },
        select: { professional: { select: { id: true } }, client: { select: { id: true } } },
      });
      const proId = target?.professional?.id;
      const cliId = target?.client?.id;

      if (data.isActive === false) {
        const apptOr = [
          ...(proId ? [{ professionalId: proId }] : []),
          ...(cliId ? [{ clientId: cliId }] : []),
        ];
        await prisma.$transaction([
          prisma.user.update({ where: { id: body.id }, data }),
          ...(proId
            ? [
                prisma.professional.update({ where: { id: proId }, data: { isActive: false } }),
                prisma.service.updateMany({
                  where: { professionalId: proId, status: { not: "PAUSED" } },
                  data: { status: "PAUSED" },
                }),
              ]
            : []),
          ...(apptOr.length
            ? [
                prisma.appointment.updateMany({
                  // Todo lo no terminado se cancela; solo se respeta lo ya COMPLETED
                  // (y lo que ya está CANCELLED / NO_SHOW).
                  where: { OR: apptOr, status: { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
                  data: { status: "CANCELLED" },
                }),
              ]
            : []),
        ]);
      } else {
        await prisma.$transaction([
          prisma.user.update({ where: { id: body.id }, data }),
          ...(proId ? [prisma.professional.update({ where: { id: proId }, data: { isActive: true } })] : []),
        ]);
      }
    } else {
      await prisma.user.update({ where: { id: body.id }, data });
    }
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
    select: {
      isActive: true,
      client: { select: { id: true } },
      professional: { select: { id: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.isActive) {
    return NextResponse.json(
      { error: "Archivá el usuario antes de eliminarlo definitivamente" },
      { status: 400 },
    );
  }

  try {
    const clientId = user.client?.id;
    const professionalId = user.professional?.id;
    const ors = [
      ...(clientId ? [{ clientId }] : []),
      ...(professionalId ? [{ professionalId }] : []),
    ];
    // Turnos: NO se borran — el FK los deja con professionalId/clientId = null y
    // el historial de la contraparte los muestra como "Usuario no encontrado".
    // Reseñas: se borran junto con la cuenta (decisión del owner).
    await prisma.$transaction([
      ...(ors.length ? [prisma.review.deleteMany({ where: { OR: ors } })] : []),
      prisma.user.delete({ where: { id: body.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "El usuario tiene datos asociados que impiden eliminarlo (mensajes, paquetes, etc.). Mantenelo archivado." },
        { status: 409 },
      );
    }
    console.error("DELETE /api/owner/usuarios", e);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
