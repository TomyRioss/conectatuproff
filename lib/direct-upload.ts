// Subida directa navegador → Supabase Storage con URL firmada.
// Vercel limita el body de funciones a 4.5 MB: videos del celular nunca deben pasar por la API.

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
}

// Algunos celulares entregan file.type vacío: se infiere por extensión.
export function mediaType(file: File) {
  if (file.type) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return EXT_TYPES[ext] ?? ""
}

// Pide URL firmada a `endpoint` (POST JSON) y sube el archivo directo al storage.
export async function directUpload<T extends { uploadUrl: string; key: string }>(endpoint: string, file: File) {
  const contentType = mediaType(file)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: file.size }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? "No se pudo preparar la subida")

  const put = await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } })
  if (!put.ok) throw new Error("No se pudo subir el archivo")
  return data as T
}
