import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["CLIENT", "PROFESSIONAL"]

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || !ALLOWED.includes(role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña necesita mínimo 8 caracteres" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    if (user.password) {
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
      }
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[PATCH /api/configuracion/password]", e)
    return NextResponse.json({ error: "Error al cambiar la contraseña" }, { status: 500 })
  }
}
