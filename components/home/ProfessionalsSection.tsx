import Link from "next/link"
import { getFeaturedPros } from "@/lib/featured-professionals"
import { ProfCard } from "./ProfCard"

export default async function ProfessionalsSection() {
  const pros = await getFeaturedPros()

  if (pros.length === 0) return null

  return (
    <section id="servicios" className="py-20 px-4 bg-[#F3F4F8]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#6B7280] text-sm font-medium uppercase tracking-wider mb-2">
              Destacados
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Profesionales verificados
              <br className="hidden sm:block" /> en tu zona
            </h2>
          </div>
          <Link
            href="/buscar"
            className="hidden sm:block text-sm text-[#6B7280] hover:text-[#6C5CE7] transition-colors border-b border-gray-200 hover:border-[#6C5CE7] pb-0.5"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pros.map((pro) => (
            <ProfCard key={pro.slug} pro={pro} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/buscar"
            className="text-sm text-[#6B7280] hover:text-[#6C5CE7] transition-colors"
          >
            Ver todos los profesionales →
          </Link>
        </div>
      </div>
    </section>
  )
}
