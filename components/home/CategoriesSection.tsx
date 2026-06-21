import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CategoryCard from "./CategoryCard"

export default async function CategoriesSection() {
  const categories = await prisma.category.findMany({
    include: { subcategories: { take: 15, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  })

  if (categories.length === 0) return null

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-brand-gray text-sm font-medium uppercase tracking-wider mb-2">
              Explorá por rubro
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-brand-dark">
              ¿Qué necesitás?
            </h2>
          </div>
          <Link
            href="/buscar"
            className="hidden sm:block text-sm text-brand-gray hover:text-brand-violet transition-colors border-b border-gray-200 hover:border-brand-violet pb-0.5"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              imageUrl={cat.imageUrl ?? null}
              subcategories={cat.subcategories}
            />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/buscar" className="text-sm text-brand-gray hover:text-brand-violet transition-colors">
            Ver todas las categorías →
          </Link>
        </div>
      </div>
    </section>
  )
}
