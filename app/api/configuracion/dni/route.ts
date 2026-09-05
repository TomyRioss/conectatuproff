import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["CLIENT", "PROFESSIONAL"]

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || !ALLOWED.includes(role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const frontKey = typeof body?.frontKey === "string" ? body.frontKey : ""
    const backKey = typeof body?.backKey === "string" ? body.backKey : ""

    const prefix = `dni-docs/${session.user.id}/`
    if (!frontKey.startsWith(prefix) || !backKey.startsWith(prefix)) {
      return NextResponse.json({ error: "Documentación inválida" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dniStatus: true },
    })
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (user.dniStatus === "PENDING" || user.dniStatus === "APPROVED") {
      return NextResponse.json({ error: "Ya enviaste tu documentación" }, { status: 409 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        dniPhotoFront: frontKey,
        dniPhotoBack: backKey,
        dniStatus: "PENDING",
        dniSubmittedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[POST /api/configuracion/dni]", e)
    return NextResponse.json({ error: "Error al enviar la documentación" }, { status: 500 })
  }
}
