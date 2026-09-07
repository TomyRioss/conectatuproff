import { getFeaturedPros } from "@/lib/featured-professionals"
import { ProfCard } from "./ProfCard"

export default async function ProfessionalsSection() {
  const pros = await getFeaturedPros()

  if (pros.length === 0) return null

  return (
    <section id="servicios" className="py-20 px-4 bg-[#F3F4F8]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div>
            <p className="text-[#6B7280] text-sm font-medium uppercase tracking-wider mb-2">
              Destacados
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Profesionales verificados
              <br className="hidden sm:block" /> en tu zona
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pros.map((pro) => (
            <ProfCard key={pro.slug} pro={pro} />
          ))}
        </div>
      </div>
    </section>
  )
}
