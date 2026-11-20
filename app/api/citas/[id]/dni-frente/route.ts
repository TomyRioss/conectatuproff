import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const appointment = await prisma.appointment.findFirst({
    where: { id, professional: { userId: session.user.id } },
    select: { client: { select: { user: { select: { dniPhotoFront: true } } } } },
  });
  const frontKey = appointment?.client?.user.dniPhotoFront;
  if (!frontKey?.startsWith("dni-docs/")) {
    return NextResponse.json({ error: "Foto no disponible" }, { status: 404 });
  }

  try {
    const signedUrl = await getPresignedDownloadUrl(frontKey, 300);
    const response = NextResponse.redirect(signedUrl);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("GET /api/citas/[id]/dni-frente", error);
    return NextResponse.json({ error: "No se pudo abrir la foto" }, { status: 500 });
  }
}
