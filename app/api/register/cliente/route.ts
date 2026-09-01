import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { clientRegisterSchema } from "@/lib/validations/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const body = await request.json();
    const parsed = clientRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, username, email, password, phone, location } = parsed.data;

    // Check-then-create no es atómico: bajo concurrencia el unique de DB
    // dispara P2002 y lo mapeamos a 409 amigable.
    try {
      await prisma.user.create({
        data: {
          email,
          username,
          name: `${firstName} ${lastName}`,
          password: await bcrypt.hash(password, 12),
          role: "CLIENT",
          isActive: true,
          client: { create: { firstName, lastName, phone, location } },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = e.meta?.target;
        const isUsername = Array.isArray(target) ? target.includes("username") : String(target ?? "").includes("username");
        return NextResponse.json({ error: isUsername ? "USERNAME_TAKEN" : "EMAIL_TAKEN" }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register/cliente]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
