import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { sendMail } from "@/lib/mail";

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
    select: { userId: true, firstName: true, user: { select: { email: true } } },
  });

  if (!professional) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.$transaction([
      prisma.professional.update({ where: { id }, data: { isVerified: true } }),
      prisma.user.update({ where: { id: professional.userId }, data: { isActive: true, role: "PROFESSIONAL" } }),
    ]);

    await prisma.notification.create({
      data: {
        userId: professional.userId,
        audience: "PROFESSIONAL",
        type: "profile_approved",
        title: "¡Tu perfil profesional fue aprobado!",
        body: "Ya podés publicar servicios y recibir turnos en Conecta Tu Proff.",
        link: "/profesional/perfil",
      },
    });

    if (professional.user.email) {
      await sendMail({
        to: professional.user.email,
        subject: "¡Tu perfil profesional fue aprobado!",
        html: `<p>Hola ${professional.firstName},</p><p>Tu perfil profesional en Conecta Tu Proff ya está verificado. Ingresá para publicar tus servicios y empezar a recibir turnos.</p>`,
      });
    }
  } else {
    await prisma.user.update({
      where: { id: professional.userId },
      data: { isBanned: true, isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
