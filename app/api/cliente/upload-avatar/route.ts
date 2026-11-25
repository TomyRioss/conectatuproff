import { signedUploadResponse } from "@/lib/signed-upload-route"

// Devuelve URL firmada; el cliente sube directo a Supabase (ver lib/direct-upload.ts).
export function POST(req: Request) {
  return signedUploadResponse(req, { role: "CLIENT", folder: "clientes/avatars", maxImageMB: 5, tag: "POST /api/cliente/upload-avatar/route.ts" })
}
