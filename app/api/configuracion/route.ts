import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["CLIENT", "PROFESSIONAL"]

export async function GET() {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || !ALLOWED.includes(role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, dniStatus: true },
    })
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    return NextResponse.json({ hasPassword: !!user.password, dniStatus: user.dniStatus })
  } catch (e) {
    console.error("[GET /api/configuracion]", e)
    return NextResponse.json({ error: "Error al cargar la configuración" }, { status: 500 })
  }
}
