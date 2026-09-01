import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rl = rateLimit(`check-username:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username || username.length < 3) {
    return NextResponse.json({ available: null });
  }

  const existing = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
