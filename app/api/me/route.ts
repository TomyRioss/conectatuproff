import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ avatarKey: null })

  const role = (session.user as { role?: string }).role

  if (role === "CLIENT") {
    const c = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { avatarUrl: true },
    })
    return NextResponse.json({ avatarKey: c?.avatarUrl ?? null })
  }

  if (role === "PROFESSIONAL") {
    const p = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { avatarUrl: true },
    })
    return NextResponse.json({ avatarKey: p?.avatarUrl ?? null })
  }

  return NextResponse.json({ avatarKey: null })
}
