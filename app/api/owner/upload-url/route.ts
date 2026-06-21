import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner-auth";
import { getPresignedUploadUrl, getPublicUrl } from "@/lib/r2";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const contentType = searchParams.get("contentType") ?? "image/jpeg";
  const prefix = searchParams.get("prefix") ?? "misc";

  const ext = contentType.split("/")[1] ?? "jpg";
  const key = `${prefix}/${randomUUID()}.${ext}`;

  const uploadUrl = await getPresignedUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
