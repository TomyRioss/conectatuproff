import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { professionalRegisterSchema } from "@/lib/validations/auth";
import { createPetitionIfNew } from "@/lib/subcategorias";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`register-pro:${clientIp(request)}`, 5, 60 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let userId: string | null = null;

  try {
    const formData = await request.formData();

    const parsed = professionalRegisterSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      specialty: formData.get("specialty"),
      phone: formData.get("phone"),
      location: formData.get("location"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, username, email, password, specialty, phone, location } = parsed.data;

    const hash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          username,
          name: `${firstName} ${lastName}`,
          password: hash,
          role: "PROFESSIONAL",
          isActive: true,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = e.meta?.target;
        const isUsername =
          Array.isArray(target) ? target.includes("username") : String(target ?? "").includes("username");
        return NextResponse.json({ error: isUsername ? "USERNAME_TAKEN" : "EMAIL_TAKEN" }, { status: 409 });
      }
      throw e;
    }
    userId = user.id;

    await prisma.$transaction([
      prisma.client.create({
        data: { userId: user.id, firstName, lastName, phone, location },
      }),
      prisma.professional.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          specialty,
          phone,
          location,
          isPro: true,
          // Auto-activación: el pro queda verificado y operativo al instante.
          isVerified: true,
        },
      }),
    ]);

    // Si la profesión no está en el listado, se registra como petición.
    await createPetitionIfNew(user.id, specialty);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register/profesional]", err);
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
