import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPetitionIfNew } from "@/lib/subcategorias";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { phone: true },
    });
    return NextResponse.json({ phone: client?.phone ?? null });
  } catch (err) {
    console.error("[profesional/onboarding GET]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const formData = await request.formData();
    const specialty = formData.get("specialty") as string | null;
    const phone = formData.get("phone") as string | null;
    const location = formData.get("location") as string | null;

    if (!specialty || !phone || !location) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const [firstName, ...rest] = (user?.name ?? "").split(" ");
    const lastName = rest.join(" ") || firstName;

    await prisma.$transaction([
      prisma.professional.upsert({
        where: { userId },
        update: {
          specialty,
          phone,
          location,
          isActive: true,
          isVerified: true,
        },
        create: {
          userId,
          firstName: firstName || "N",
          lastName: lastName || "N",
          specialty,
          phone,
          location,
          isActive: true,
          isPro: true,
          // Auto-activación: el pro queda verificado y operativo al instante.
          isVerified: true,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: "PROFESSIONAL" },
      }),
    ]);

    // Si la profesión no está en el listado, se registra como petición.
    await createPetitionIfNew(userId, specialty);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profesional/onboarding]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
