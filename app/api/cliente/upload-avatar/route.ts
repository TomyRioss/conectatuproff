import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/r2"
import { randomUUID } from "crypto"

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Máximo 5 MB" }, { status: 400 })

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }

  const ext = file.type.split("/")[1]
  const key = `clientes/avatars/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile(key, buffer, file.type)
  return NextResponse.json({ key })
}
