import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/r2";
import { randomUUID } from "crypto";

async function uploadDniPhoto(file: File, userId: string, side: "front" | "back"): Promise<string> {
  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `dni-docs/${userId}/${side}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadFile(key, buffer, file.type);
  return key;
}

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
    const phone = formData.get("phone") as string | null;
    const dni = formData.get("dni") as string | null;
    const dniFrontFile = formData.get("dniFront") as File | null;
    const dniBackFile = formData.get("dniBack") as File | null;

    if (!phone || !dni || !dniFrontFile || !dniBackFile) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const dniNum = parseInt(dni, 10);
    if (isNaN(dniNum)) {
      return NextResponse.json({ error: "INVALID_DNI" }, { status: 400 });
    }

    const userId = session.user.id;
    const [dniFrontKey, dniBackKey] = await Promise.all([
      uploadDniPhoto(dniFrontFile, userId, "front"),
      uploadDniPhoto(dniBackFile, userId, "back"),
    ]);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const [firstName, ...rest] = (user?.name ?? "").split(" ");
    const lastName = rest.join(" ") || firstName;

    await prisma.professional.upsert({
      where: { userId },
      update: {
        phone,
        dni: dniNum,
        dniPhotoFront: dniFrontKey,
        dniPhotoBack: dniBackKey,
        isActive: true,
      },
      create: {
        userId,
        firstName: firstName || "N",
        lastName: lastName || "N",
        phone,
        dni: dniNum,
        dniPhotoFront: dniFrontKey,
        dniPhotoBack: dniBackKey,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profesional/onboarding]", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
