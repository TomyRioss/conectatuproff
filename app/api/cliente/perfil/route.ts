import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { firstName, lastName, avatarUrl } = await req.json()

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "Nombre y apellido requeridos" }, { status: 400 })
  }

  const cliente = await prisma.client.update({
    where: { userId: session.user.id },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: `${firstName.trim()} ${lastName.trim()}` },
  })

  return NextResponse.json(cliente)
}
