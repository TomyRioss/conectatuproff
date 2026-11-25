import { signedUploadResponse } from "@/lib/signed-upload-route"

// Devuelve URL firmada; el cliente sube directo a Supabase (ver lib/direct-upload.ts).
export function POST(req: Request) {
  return signedUploadResponse(req, { role: "PROFESSIONAL", folder: "profesionales/servicios", maxImageMB: 5, tag: "POST /api/profesional/servicios/upload-image/route.ts" })
}
