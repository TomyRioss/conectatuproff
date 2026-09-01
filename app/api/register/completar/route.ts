import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/validations/auth";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`complete-profile:${clientIp(request)}`, 5, 60 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = completeProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, password: true },
    });
    if (!current) {
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    // Already complete: nothing to do (avoids overwriting an existing password).
    if (current.username && current.password) {
      return NextResponse.json({ ok: true });
    }

    const { username, password } = parsed.data;

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: current.username ?? username,
          password: current.password ?? (await bcrypt.hash(password, 12)),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register/completar]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
