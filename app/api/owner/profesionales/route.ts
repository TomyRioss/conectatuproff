import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/owner-auth";
import { getPresignedDownloadUrl } from "@/lib/storage";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const profesionales = await prisma.professional.findMany({
    where: { isVerified: false },
    include: {
      user: { select: { id: true, email: true, isActive: true, isBanned: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = await Promise.all(
    profesionales.map(async (p) => ({
      ...p,
      // URLs firmadas cortas: 15 min alcanza para que el admin las previsualice.
      dniPhotoFront: p.dniPhotoFront ? await getPresignedDownloadUrl(p.dniPhotoFront, 900) : null,
      dniPhotoBack: p.dniPhotoBack ? await getPresignedDownloadUrl(p.dniPhotoBack, 900) : null,
    }))
  );

  return NextResponse.json(result);
}
