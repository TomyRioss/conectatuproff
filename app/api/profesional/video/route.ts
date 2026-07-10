import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadFile, deleteFile } from "@/lib/storage"
import { randomUUID } from "crypto"

const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 50 MB" }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }

  const existing = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { videoUrl: true },
  })
  if (existing?.videoUrl) {
    await deleteFile(existing.videoUrl).catch(() => {})
  }

  const ext = file.type.split("/")[1]
  const key = `profesionales/videos/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile(key, buffer, file.type)
  await prisma.professional.update({
    where: { userId: session.user.id },
    data: { videoUrl: key },
  })

  return NextResponse.json({ key })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { videoUrl: true },
  })
  if (pro?.videoUrl) {
    await deleteFile(pro.videoUrl).catch(() => {})
  }
  await prisma.professional.update({
    where: { userId: session.user.id },
    data: { videoUrl: null },
  })

  return NextResponse.json({ ok: true })
}
