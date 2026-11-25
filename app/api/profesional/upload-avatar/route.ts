import { signedUploadResponse } from "@/lib/signed-upload-route"

// Devuelve URL firmada; el cliente sube directo a Supabase (ver lib/direct-upload.ts).
export function POST(req: Request) {
  return signedUploadResponse(req, { role: "PROFESSIONAL", folder: "profesionales/avatars", maxImageMB: 5, tag: "POST /api/profesional/upload-avatar/route.ts" })
}
