import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner-auth";
import { getPresignedDownloadUrl } from "@/lib/r2";

export async function GET(req: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key || !key.startsWith("dni-docs/")) {
    return NextResponse.json({ error: "INVALID_KEY" }, { status: 400 });
  }

  const url = await getPresignedDownloadUrl(key, 300);
  return NextResponse.json({ url });
}
