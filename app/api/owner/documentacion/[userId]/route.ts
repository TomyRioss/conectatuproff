import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOwner } from "@/lib/owner-auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { error } = await requireOwner()
  if (error) return error

  const { userId } = await params
  const { action } = await req.json().catch(() => ({}))

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dniStatus: true, client: { select: { id: true } }, professional: { select: { id: true } } },
  })
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  if (user.dniStatus !== "PENDING") {
    return NextResponse.json({ error: "Esta documentación no está pendiente" }, { status: 409 })
  }

  const approved = action === "approve"
  const audiences: ("CLIENT" | "PROFESSIONAL")[] = []
  if (user.client) audiences.push("CLIENT")
  if (user.professional) audiences.push("PROFESSIONAL")

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { dniStatus: approved ? "APPROVED" : "REJECTED" },
    }),
    ...audiences.map((audience) =>
      prisma.notification.create({
        data: {
          userId,
          audience,
          type: approved ? "dni_approved" : "dni_rejected",
          title: approved ? "Documentación verificada" : "Documentación rechazada",
          body: approved
            ? "Tu DNI fue verificado correctamente."
            : "Tu DNI fue rechazado. Revisá las fotos y volvé a enviarlo desde Configuración.",
          link: "/configuracion",
        },
      })
    ),
  ])

  return NextResponse.json({ ok: true })
}
