import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { resolveWeeklyWindows } from "@/lib/availability";
import { arDateKey, getArParts } from "@/lib/time";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { professionalId, serviceId, startAt } = (body ?? {}) as {
    professionalId?: unknown;
    serviceId?: unknown;
    startAt?: unknown;
  };

  if (
    typeof professionalId !== "string" ||
    typeof startAt !== "string" ||
    (serviceId !== undefined && typeof serviceId !== "string")
  ) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const start = new Date(startAt);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() - 60000) {
    return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!client) return NextResponse.json({ error: "Perfil de cliente no encontrado" }, { status: 404 });

    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, isActive: true, isVerified: true },
      select: { id: true, firstName: true, user: { select: { email: true } } },
    });
    if (!professional) {
      return NextResponse.json({ error: "Profesional no disponible" }, { status: 404 });
    }

    const service = serviceId
      ? await prisma.service.findUnique({
          where: { id: serviceId },
          select: { title: true, price: true, currency: true, durationMin: true, professionalId: true, status: true },
        })
      : null;

    if (serviceId && (!service || service.professionalId !== professionalId)) {
      return NextResponse.json({ error: "Servicio inválido" }, { status: 400 });
    }

    const durationMin = service?.durationMin ?? 60;
    const end = new Date(start.getTime() + durationMin * 60000);

    // ── Revalidación server-side del slot (no confiamos en el wizard) ──
    // El turno debe caer dentro de una ventana de disponibilidad semanal
    // (hora de pared AR) y no pisar bloqueos ni otros turnos.
    const dateKey = arDateKey(start);
    const startMinutes = getArParts(start).minutes;
    const [weeklyWindows, blocked] = await Promise.all([
      resolveWeeklyWindows(professionalId, serviceId ?? null),
      prisma.blockedSlot.findMany({
        where: { professionalId, startAt: { lt: end }, endAt: { gt: start } },
        select: { startAt: true, endAt: true },
      }),
    ]);

    const windows = weeklyWindows.get(getArParts(start).dayOfWeek) ?? [];
    const fitsWindow = windows.some(
      (w) => startMinutes >= w.start && startMinutes + durationMin <= w.end
    );
    if (!fitsWindow) {
      return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
    }
    if (blocked.some((b) => b.startAt < end && b.endAt > start)) {
      return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
    }

    // ── Creación atómica: advisory lock por profesional evita doble reserva
    // bajo requests concurrentes (check + create en la misma transacción). ──
    const appointment = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${professionalId}))`;

        const overlapping = await tx.appointment.findMany({
          where: {
            professionalId,
            status: { in: ["PENDING", "CONFIRMED"] },
            startAt: { gte: new Date(start.getTime() - 6 * 3600000), lt: end },
          },
          select: { startAt: true, durationMin: true },
        });
        const overlaps = overlapping.some(
          (a) => a.startAt < end && new Date(a.startAt.getTime() + (a.durationMin ?? 60) * 60000) > start
        );
        if (overlaps) return null;

        return tx.appointment.create({
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
      },
      { timeout: 15000 }
    );

    if (!appointment) {
      return NextResponse.json({ error: "SLOT_TAKEN" }, { status: 409 });
    }

    const conversation = await prisma.conversation.upsert({
      where: { professionalId_clientId: { professionalId, clientId: client.id } },
      update: {},
      create: { professionalId, clientId: client.id },
      select: { id: true },
    });

    const clientUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    if (professional.user.email) {
      await sendMail({
        to: professional.user.email,
        subject: "Nuevo turno reservado",
        html: `
          <p>Hola ${professional.firstName},</p>
          <p><strong>${clientUser?.name ?? "Un cliente"}</strong> reservó un turno${service ? ` para <strong>${service.title}</strong>` : ""}.</p>
          <p>Fecha: ${start.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}</p>
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
