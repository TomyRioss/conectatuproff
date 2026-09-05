import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOwner } from "@/lib/owner-auth"
import { getPresignedDownloadUrl } from "@/lib/storage"

export async function GET() {
  const { error } = await requireOwner()
  if (error) return error

  const users = await prisma.user.findMany({
    where: { dniStatus: "PENDING" },
    select: {
      id: true,
      name: true,
      email: true,
      dniPhotoFront: true,
      dniPhotoBack: true,
      dniSubmittedAt: true,
      client: { select: { id: true } },
      professional: { select: { id: true } },
    },
    orderBy: { dniSubmittedAt: "desc" },
  })

  const result = await Promise.all(
    users.map(async (u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dniSubmittedAt: u.dniSubmittedAt,
      roles: [u.client ? "Cliente" : null, u.professional ? "Profesional" : null].filter(Boolean),
      dniPhotoFront: u.dniPhotoFront ? await getPresignedDownloadUrl(u.dniPhotoFront, 900) : null,
      dniPhotoBack: u.dniPhotoBack ? await getPresignedDownloadUrl(u.dniPhotoBack, 900) : null,
    }))
  )

  return NextResponse.json(result)
}
