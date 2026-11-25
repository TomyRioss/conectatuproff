import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"
import { getPresignedUploadUrl } from "@/lib/storage"

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"]
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"]
const MB = 1024 * 1024

// Handler común: valida rol/tipo/peso y devuelve URL firmada.
// El archivo se sube directo a Supabase (Vercel limita el body de funciones a 4.5 MB).
export async function signedUploadResponse(
  req: Request,
  opts: { role: "PROFESSIONAL" | "CLIENT"; folder: string; maxImageMB?: number; maxVideoMB?: number; tag: string },
) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== opts.role) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const contentType = String(body?.contentType ?? "")
  const size = Number(body?.size ?? 0)

  const isImage = opts.maxImageMB != null && ALLOWED_IMAGE.includes(contentType)
  const isVideo = opts.maxVideoMB != null && ALLOWED_VIDEO.includes(contentType)
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }
  if (isVideo && size > opts.maxVideoMB! * MB) {
    return NextResponse.json({ error: `Video: máximo ${opts.maxVideoMB} MB` }, { status: 400 })
  }
  if (isImage && size > opts.maxImageMB! * MB) {
    return NextResponse.json({ error: `Imagen: máximo ${opts.maxImageMB} MB` }, { status: 400 })
  }

  const key = `${opts.folder}/${session.user.id}/${randomUUID()}.${contentType.split("/")[1]}`
  try {
    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key, type: isVideo ? "video" : "image" })
  } catch (e) {
    console.error(opts.tag, e)
    return NextResponse.json({ error: "No se pudo preparar la subida" }, { status: 500 })
  }
}
