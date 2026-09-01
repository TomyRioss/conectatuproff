import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile } from "@/lib/storage";
import { professionalRegisterSchema } from "@/lib/validations/auth";
import { createPetitionIfNew } from "@/lib/subcategorias";
import { validateImageFile, extForImageType } from "@/lib/file-validation";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rl = rateLimit(`register-pro:${clientIp(request)}`, 5, 60 * 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let userId: string | null = null;
  const uploadedKeys: string[] = [];

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
      dni: formData.get("dni"),
      location: formData.get("location"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, username, email, password, specialty, phone, location } = parsed.data;
    const dni = parseInt(parsed.data.dni, 10);

    const dniFront = formData.get("dniFront") as File | null;
    const dniBack = formData.get("dniBack") as File | null;

    if (!dniFront || !dniBack) {
      return NextResponse.json(
        { error: "VALIDATION", issues: { fieldErrors: { dniFront: ["Requerido"], dniBack: ["Requerido"] } } },
        { status: 400 }
      );
    }

    // Validación server-side de las imágenes (el check del cliente es evitable).
    const frontError = validateImageFile(dniFront);
    if (frontError) {
      return NextResponse.json({ error: "VALIDATION", issues: { fieldErrors: { dniFront: [frontError] } } }, { status: 400 });
    }
    const backError = validateImageFile(dniBack);
    if (backError) {
      return NextResponse.json({ error: "VALIDATION", issues: { fieldErrors: { dniBack: [backError] } } }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          username,
          name: `${firstName} ${lastName}`,
          password: hash,
          role: "CLIENT",
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

    // Extensión fija derivada del MIME validado (nunca del filename del cliente).
    const frontExt = extForImageType(dniFront.type);
    const backExt = extForImageType(dniBack.type);

    const frontKey = `dni/${user.id}/front.${frontExt}`;
    const backKey = `dni/${user.id}/back.${backExt}`;

    // Se sube antes de la tx y se registran las keys para poder limpiar
    // los archivos si algo falla después (no dejar DNIs huérfanos).
    const [dniPhotoFront, dniPhotoBack] = await Promise.all([
      uploadFile(frontKey, Buffer.from(await dniFront.arrayBuffer()), dniFront.type),
      uploadFile(backKey, Buffer.from(await dniBack.arrayBuffer()), dniBack.type),
    ]);
    uploadedKeys.push(dniPhotoFront, dniPhotoBack);

    await prisma.$transaction([
      prisma.client.create({
        data: { userId: user.id, firstName, lastName, phone, dni, location },
      }),
      prisma.professional.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          specialty,
          phone,
          dni,
          dniPhotoFront,
          dniPhotoBack,
          location,
          isPro: true,
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
    // Limpieza de archivos huérfanos si la transacción falló.
    await Promise.all(uploadedKeys.map((k) => deleteFile(k).catch(() => {})));
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
