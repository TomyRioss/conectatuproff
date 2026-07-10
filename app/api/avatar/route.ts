import { NextResponse } from "next/server"
import { getPublicUrl } from "@/lib/storage"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  return NextResponse.redirect(getPublicUrl(key), { status: 307 })
}
