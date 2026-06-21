import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientRegisterSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = clientRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hash,
        role: "CLIENT",
        isActive: true,
        client: { create: { firstName, lastName, phone } },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register/cliente]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
