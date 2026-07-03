import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
  }

  try {
    await prisma.petition.create({
      data: { userId: session.user.id, name: name.trim() },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("POST /api/subcategorias/solicitar", e)
    return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 })
  }
}
