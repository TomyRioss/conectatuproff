// Debug: ver avatarUrl/user.image de los profesionales
import { prisma } from "../../lib/prisma";

async function main() {
  const pros = await prisma.professional.findMany({
    where: { isActive: true, isVerified: true, user: { isActive: true } },
    take: 5,
    select: {
      firstName: true,
      avatarUrl: true,
      user: { select: { username: true, image: true } },
    },
  });
  for (const p of pros) {
    console.log(p.firstName, "| avatarUrl:", JSON.stringify(p.avatarUrl), "| user.image:", JSON.stringify(p.user.image));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
