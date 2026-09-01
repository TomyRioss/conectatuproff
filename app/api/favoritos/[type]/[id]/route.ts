import { NextResponse } from "next/server"
import { Prisma } from "@/lib/generated/prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type FavType = "profesional" | "servicio"

function whereFor(type: FavType, userId: string, id: string) {
  if (type === "profesional") return { userId_professionalId: { userId, professionalId: id } }
  return { userId_serviceId: { userId, serviceId: id } }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ favorited: false })

  const { type, id } = await params
  if (type !== "profesional" && type !== "servicio") {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  const favorite = await prisma.favorite.findUnique({ where: whereFor(type, session.user.id, id) })
  return NextResponse.json({ favorited: !!favorite })
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { type, id } = await params
  if (type !== "profesional" && type !== "servicio") {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  try {
    await prisma.favorite.upsert({
      where: whereFor(type, session.user.id, id),
      create: {
        userId: session.user.id,
        professionalId: type === "profesional" ? id : undefined,
        serviceId: type === "servicio" ? id : undefined,
      },
      update: {},
    })
    return NextResponse.json({ favorited: true }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2003" || e.code === "P2025")) {
      return NextResponse.json({ error: "El profesional o servicio no existe" }, { status: 404 })
    }
    console.error("POST /api/favoritos", e)
    return NextResponse.json({ error: "No se pudo agregar a favoritos" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { type, id } = await params
  if (type !== "profesional" && type !== "servicio") {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  try {
    await prisma.favorite.delete({ where: whereFor(type, session.user.id, id) })
    return NextResponse.json({ favorited: false })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ favorited: false })
    }
    console.error("DELETE /api/favoritos", e)
    return NextResponse.json({ error: "No se pudo quitar de favoritos" }, { status: 500 })
  }
}
