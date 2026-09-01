import { NextResponse } from "next/server"
import { PRIVATE_BUCKETS, bucketForKey, getPublicUrl } from "@/lib/storage"

// Proxy de imágenes de storage. Solo sirve buckets públicos: rechazar keys que
// caen en buckets privados (DNI, documentos) para no depender solo de la
// configuración del bucket.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  const bucket = bucketForKey(key)
  if (PRIVATE_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Archivo no accesible" }, { status: 403 })
  }

  return NextResponse.redirect(getPublicUrl(key), { status: 307 })
}
