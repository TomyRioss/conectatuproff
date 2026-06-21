import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/r2";
import { professionalRegisterSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  let userId: string | null = null;

  try {
    const formData = await request.formData();

    const parsed = professionalRegisterSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: formData.get("phone"),
      dni: formData.get("dni"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone } = parsed.data;
    const dni = parseInt(parsed.data.dni, 10);

    const dniFront = formData.get("dniFront") as File | null;
    const dniBack = formData.get("dniBack") as File | null;

    if (!dniFront || !dniBack) {
      return NextResponse.json(
        { error: "VALIDATION", issues: { fieldErrors: { dniFront: ["Requerido"], dniBack: ["Requerido"] } } },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hash, role: "PROFESSIONAL", isActive: false },
    });
    userId = user.id;

    const frontExt = dniFront.name.split(".").pop() ?? "jpg";
    const backExt = dniBack.name.split(".").pop() ?? "jpg";

    const [dniPhotoFront, dniPhotoBack] = await Promise.all([
      uploadFile(
        `dni/${user.id}/front.${frontExt}`,
        Buffer.from(await dniFront.arrayBuffer()),
        dniFront.type
      ),
      uploadFile(
        `dni/${user.id}/back.${backExt}`,
        Buffer.from(await dniBack.arrayBuffer()),
        dniBack.type
      ),
    ]);

    await prisma.professional.create({
      data: { userId: user.id, firstName, lastName, phone, dni, dniPhotoFront, dniPhotoBack },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register/profesional]", err);
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
