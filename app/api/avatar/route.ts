import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (!key) return NextResponse.json({ error: "key requerido" }, { status: 400 })

  try {
    const obj = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }))
    const body = await obj.Body!.transformToByteArray()
    return new Response(Buffer.from(body), {
      headers: {
        "Content-Type": obj.ContentType ?? "image/jpeg",
        "Cache-Control": "private, max-age=31536000",
      },
    })
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
}
