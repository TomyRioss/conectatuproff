import { signedUploadResponse } from "@/lib/signed-upload-route"

// Devuelve URL firmada; el cliente sube directo a Supabase (ver lib/direct-upload.ts).
export function POST(req: Request) {
  return signedUploadResponse(req, { role: "PROFESSIONAL", folder: "profesionales/portfolio", maxImageMB: 5, maxVideoMB: 50, tag: "POST /api/profesional/portfolio/upload-image/route.ts" })
}
