import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    const appointments = await prisma.appointment.findMany({
      where: { clientId: client.id },
      orderBy: { startAt: "desc" },
      select: {
        id: true,
        startAt: true,
        durationMin: true,
        status: true,
        priceAtBooking: true,
        currency: true,
        service: { select: { title: true } },
        professional: { select: { firstName: true, lastName: true, avatarUrl: true, user: { select: { image: true } } } },
      },
    });

    const result = appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      durationMin: a.durationMin,
      status: a.status,
      price: a.priceAtBooking,
      currency: a.currency,
      serviceName: a.service?.title ?? null,
      professionalName: `${a.professional.firstName} ${a.professional.lastName}`,
      professionalAvatar: a.professional.avatarUrl ? `/api/avatar?key=${encodeURIComponent(a.professional.avatarUrl)}` : a.professional.user.image,
    }));

    return NextResponse.json({ appointments: result });
  } catch (e) {
    console.error("GET /api/citas", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { professionalId, serviceId, startAt } = body as { professionalId?: string; serviceId?: string; startAt?: string };

  if (!professionalId || !startAt) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime()) || start < new Date()) {
    return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    const service = serviceId
      ? await prisma.service.findUnique({ where: { id: serviceId }, select: { title: true, price: true, currency: true, durationMin: true, professionalId: true } })
      : null;

    if (serviceId && service?.professionalId !== professionalId) {
      return NextResponse.json({ error: "Servicio inválido" }, { status: 400 });
    }

    const durationMin = service?.durationMin ?? 60;
    const end = new Date(start.getTime() + durationMin * 60000);

    const sameDay = await prisma.appointment.findMany({
      where: {
        professionalId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { gte: new Date(start.getTime() - 6 * 3600000), lt: end },
      },
      select: { startAt: true, durationMin: true },
    });
    const overlaps = sameDay.some(
      (a) => a.startAt < end && new Date(a.startAt.getTime() + (a.durationMin ?? 60) * 60000) > start
    );
    if (overlaps) {
      return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        professionalId,
        clientId: client.id,
        serviceId: serviceId ?? null,
        priceAtBooking: service?.price ?? null,
        currency: service?.currency ?? "ARS",
        startAt: start,
        durationMin,
        status: "PENDING",
      },
    });

    const conversation = await prisma.conversation.upsert({
      where: { professionalId_clientId: { professionalId, clientId: client.id } },
      update: {},
      create: { professionalId, clientId: client.id },
      select: { id: true },
    });

    const [professional, clientUser] = await Promise.all([
      prisma.professional.findUnique({ where: { id: professionalId }, select: { firstName: true, user: { select: { email: true } } } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    ]);

    if (professional?.user.email) {
      await sendMail({
        to: professional.user.email,
        subject: "Nuevo turno reservado",
        html: `
          <p>Hola ${professional.firstName},</p>
          <p><strong>${clientUser?.name ?? "Un cliente"}</strong> reservó un turno${service ? ` para <strong>${service.title}</strong>` : ""}.</p>
          <p>Fecha: ${start.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
          <p>Ingresá a tu agenda en Conecta Tu Proff para confirmarlo.</p>
        `,
      });
    }

    return NextResponse.json({ ok: true, id: appointment.id, conversationId: conversation.id });
  } catch (e) {
    console.error("POST /api/citas", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
