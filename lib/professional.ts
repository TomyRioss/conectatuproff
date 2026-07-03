import { prisma } from "@/lib/prisma";

export async function getOwnUsername(userId: string) {
  const pro = await prisma.professional.findUnique({
    where: { userId },
    select: { user: { select: { username: true } } },
  });
  if (!pro) return { hasProfessional: false as const, username: null };
  return { hasProfessional: true as const, username: pro.user.username };
}
