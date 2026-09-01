import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";
import { validateImageFile, extForImageType } from "@/lib/file-validation";
import { createPetitionIfNew } from "@/lib/subcategorias";

const DNI_RE = /^\d{7,8}$/;

async function uploadDniPhoto(file: File, userId: string, side: "front" | "back"): Promise<string> {
  // Extensión fija derivada del MIME validado, nunca del input del cliente.
  const ext = extForImageType(file.type);
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
    const specialty = formData.get("specialty") as string | null;
    const phone = formData.get("phone") as string | null;
    const dni = formData.get("dni") as string | null;
    const dniFrontFile = formData.get("dniFront") as File | null;
    const dniBackFile = formData.get("dniBack") as File | null;

    if (!specialty || !phone || !dni || !dniFrontFile || !dniBackFile) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const dniNum = parseInt(dni, 10);
    if (isNaN(dniNum) || !DNI_RE.test(dni)) {
      return NextResponse.json({ error: "INVALID_DNI" }, { status: 400 });
    }

    // Validación server-side de las imágenes (el check del cliente es evitable).
    const frontError = validateImageFile(dniFrontFile);
    if (frontError) return NextResponse.json({ error: "INVALID_DNI_FRONT", detail: frontError }, { status: 400 });
    const backError = validateImageFile(dniBackFile);
    if (backError) return NextResponse.json({ error: "INVALID_DNI_BACK", detail: backError }, { status: 400 });

    const userId = session.user.id;
    const [dniFrontKey, dniBackKey] = await Promise.all([
      uploadDniPhoto(dniFrontFile, userId, "front"),
      uploadDniPhoto(dniBackFile, userId, "back"),
    ]);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const [firstName, ...rest] = (user?.name ?? "").split(" ");
    const lastName = rest.join(" ") || firstName;

    await prisma.$transaction([
      prisma.professional.upsert({
        where: { userId },
        update: {
          specialty,
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
          specialty,
          phone,
          dni: dniNum,
          dniPhotoFront: dniFrontKey,
          dniPhotoBack: dniBackKey,
          isActive: true,
          isPro: true,
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
