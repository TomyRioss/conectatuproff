import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPresignedUploadUrl } from "@/lib/r2"
import { randomUUID } from "crypto"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get("contentType") ?? "image/jpeg"
  const ext = contentType.split("/")[1] ?? "jpg"
  const key = `clientes/avatars/${session.user.id}/${randomUUID()}.${ext}`

  const uploadUrl = await getPresignedUploadUrl(key, contentType)
  return NextResponse.json({ uploadUrl, key })
}
