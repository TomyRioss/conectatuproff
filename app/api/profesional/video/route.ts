import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"
import { signedUploadResponse } from "@/lib/signed-upload-route"

// Paso 1: devuelve URL firmada; el video se sube directo a Supabase (evita límite 4.5 MB de Vercel).
export function POST(req: Request) {
  return signedUploadResponse(req, { role: "PROFESSIONAL", folder: "profesionales/videos", maxVideoMB: 50, tag: "POST /api/profesional/video" })
}

// Paso 2: guarda la key del video ya subido y borra el anterior.
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const key = String(body?.key ?? "")
  if (!key.startsWith(`profesionales/videos/${session.user.id}/`) || key.includes("..")) {
    return NextResponse.json({ error: "Video inválido" }, { status: 400 })
  }

  try {
    const existing = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: { videoUrl: true },
    })
    if (existing?.videoUrl && existing.videoUrl !== key) {
      await deleteFile(existing.videoUrl).catch(() => {})
    }
    await prisma.professional.update({
      where: { userId: session.user.id },
      data: { videoUrl: key },
    })
    return NextResponse.json({ key })
  } catch (e) {
    console.error("PUT /api/profesional/video", e)
    return NextResponse.json({ error: "No se pudo guardar el video" }, { status: 500 })
  }
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
