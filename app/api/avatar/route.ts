import { NextResponse } from "next/server"
import { PRIVATE_BUCKETS, bucketForKey, getPublicUrl } from "@/lib/storage"

// Proxy de imágenes de storage. Solo sirve buckets públicos: rechazar keys que
// caigan en buckets privados (DNI, documentos) para no depender solo de la
// configuración del bucket.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  // URL absoluta de avatar de Google: se streamea desde el server. El navegador
  // sufre rate-limit/ORB de lh3.googleusercontent.com cuando varias <img>
  // piden avatares en ráfaga (quedan en fallback de iniciales para siempre);
  // server-side la IP no recibe ese bloqueo por burst.
  if (/^https:\/\/lh3\.googleusercontent\.com\//.test(key)) {
    try {
      const upstream = await fetch(key, { cache: "no-store" })
      if (!upstream.ok || !upstream.body) {
        return new NextResponse(null, { status: 404 })
      }
      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      })
    } catch {
      return new NextResponse(null, { status: 404 })
    }
  }

  const bucket = bucketForKey(key)
  if (PRIVATE_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Archivo no accesible" }, { status: 403 })
  }

  return NextResponse.redirect(getPublicUrl(key), { status: 307 })
}
