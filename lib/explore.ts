import { prisma } from "@/lib/prisma";

export async function getSuggestedServices(take = 6) {
  return prisma.service.findMany({
    where: { status: "ACTIVE", professional: { isActive: true, isVerified: true, user: { isActive: true } } },
    orderBy: [{ professional: { isPro: "desc" } }, { createdAt: "desc" }],
    take,
    include: { professional: { include: { user: { select: { username: true } } } } },
  });
}

export async function getTopCategoriesWithServices(categoriesCount = 3, perCategory = 6) {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { services: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { services: { _count: "desc" } },
    take: categoriesCount,
  });

  const withServices = await Promise.all(
    categories
      .filter((c) => c._count.services > 0)
      .map(async (category) => ({
        category,
        services: await prisma.service.findMany({
          where: { status: "ACTIVE", categoryId: category.id, professional: { isActive: true, isVerified: true, user: { isActive: true } } },
          orderBy: [{ professional: { isPro: "desc" } }, { createdAt: "desc" }],
          take: perCategory,
          include: { professional: { include: { user: { select: { username: true } } } } },
        }),
      }))
  );

  return withServices;
}
