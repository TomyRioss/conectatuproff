import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"
import { randomUUID } from "crypto"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

  const isVideo = ALLOWED_VIDEO.includes(file.type)
  const isImage = ALLOWED_IMAGE.includes(file.type)
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Video: máximo 50 MB" }, { status: 400 })
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Imagen: máximo 5 MB" }, { status: 400 })
  }

  const ext = file.type.split("/")[1]
  const key = `profesionales/servicios/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile(key, buffer, file.type)
  return NextResponse.json({ key, type: isVideo ? "video" : "image" })
}
