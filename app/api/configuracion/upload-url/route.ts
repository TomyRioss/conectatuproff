import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"
import { getPresignedUploadUrl } from "@/lib/storage"

const ALLOWED = ["CLIENT", "PROFESSIONAL"]

export async function GET(req: Request) {
  try {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user?.id || !ALLOWED.includes(role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const side = searchParams.get("side")
    if (side !== "front" && side !== "back") {
      return NextResponse.json({ error: "Lado inválido" }, { status: 400 })
    }
    const contentType = searchParams.get("contentType") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 })
    }
    const ext = contentType.split("/")[1] ?? "jpg"
    const key = `dni-docs/${session.user.id}/${side}-${randomUUID()}.${ext}`

    const uploadUrl = await getPresignedUploadUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key })
  } catch (e) {
    console.error("[GET /api/configuracion/upload-url]", e)
    return NextResponse.json({ error: "No se pudo preparar la subida" }, { status: 500 })
  }
}
