import { prisma } from "@/lib/prisma";

/**
 * Registra una Petition si `name` no coincide con ninguna subcategoría existente
 * (comparación case-insensitive, sin espacios extremos). No lanza: loguea y sigue.
 */
export async function createPetitionIfNew(userId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  try {
    const existing = await prisma.subcategory.findFirst({
      where: { name: { equals: trimmed, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) return;

    // Evitar peticiones duplicadas del mismo usuario para la misma profesión.
    const dupe = await prisma.petition.findFirst({
      where: { userId, name: { equals: trimmed, mode: "insensitive" }, status: "PENDING" },
      select: { id: true },
    });
    if (dupe) return;

    await prisma.petition.create({ data: { userId, name: trimmed } });
  } catch (e) {
    console.error("createPetitionIfNew", e);
  }
}
