import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRIVATE_PREFIXES = ["dni-docs/", "dni/"]

// Buckets que el proxy público /api/avatar nunca debe servir.
export const PRIVATE_BUCKETS = new Set(["documentos-privados"])

export function bucketForKey(key: string) {
  if (PRIVATE_PREFIXES.some((p) => key.startsWith(p))) return "documentos-privados"
  if (key.startsWith("profesionales/portfolio/")) return "portfolio"
  if (key.startsWith("profesionales/servicios/")) return "servicios"
  if (key.startsWith("categorias/") || key.startsWith("subcategorias/")) return "servicios"
  if (key.startsWith("profesionales/videos/")) return "videos"
  if (key.startsWith("profesionales/avatars/") || key.startsWith("clientes/avatars/")) return "avatars"
  // ponytail: unmatched prefixes (e.g. owner upload-url misc) default private, admin-only anyway
  return "documentos-privados"
}

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  const bucket = bucketForKey(key)
  const { error } = await supabase.storage.from(bucket).upload(key, body, { contentType, upsert: true })
  if (error) throw error
  return key
}

export async function deleteFile(key: string) {
  const bucket = bucketForKey(key)
  await supabase.storage.from(bucket).remove([key])
}

export async function getPresignedUploadUrl(key: string, _contentType: string, _expiresIn = 300) {
  const bucket = bucketForKey(key)
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key, { upsert: true })
  if (error) throw error
  return data.signedUrl
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
  const bucket = bucketForKey(key)
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export function getPublicUrl(key: string) {
  const bucket = bucketForKey(key)
  return supabase.storage.from(bucket).getPublicUrl(key).data.publicUrl
}
