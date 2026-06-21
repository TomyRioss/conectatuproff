import Link from "next/link"
import { ProfCard, type ProfCardData } from "./ProfCard"

const SAMPLE_PROS: ProfCardData[] = [
  {
    slug: "laura-miranda",
    name: "Laura Miranda",
    specialty: "Masajes terapéuticos",
    zone: "Palermo, CABA",
    rating: 4.9,
    reviews: 124,
    priceFrom: 3500,
    premium: true,
    initials: "LM",
    color: "#1EC97E",
  },
  {
    slug: "diego-n",
    name: "Diego N.",
    specialty: "Plomero · Urgencias 24h",
    zone: "Belgrano, CABA",
    rating: 4.7,
    reviews: 89,
    priceFrom: 4500,
    premium: false,
    initials: "DN",
    color: "#6C5CE7",
  },
  {
    slug: "elena-brea",
    name: "Elena Brea",
    specialty: "Kinesiología deportiva",
    zone: "San Isidro, GBA",
    rating: 5.0,
    reviews: 57,
    priceFrom: 5000,
    premium: true,
    initials: "EB",
    color: "#1A1A2E",
  },
  {
    slug: "sofia-r",
    name: "Sofía R.",
    specialty: "Reflexóloga · Bienestar",
    zone: "Caballito, CABA",
    rating: 4.8,
    reviews: 102,
    priceFrom: 3200,
    premium: false,
    initials: "SR",
    color: "#1EC97E",
  },
  {
    slug: "martin-v",
    name: "Martín V.",
    specialty: "Electricista · Urgencias",
    zone: "Lanús, GBA",
    rating: 4.6,
    reviews: 74,
    priceFrom: 4800,
    premium: false,
    initials: "MV",
    color: "#6C5CE7",
  },
  {
    slug: "andrea-p",
    name: "Andrea P.",
    specialty: "Limpieza · Hogar",
    zone: "Flores, CABA",
    rating: 4.9,
    reviews: 88,
    priceFrom: 2500,
    premium: true,
    initials: "AP",
    color: "#1A1A2E",
  },
]

export default function ProfessionalsSection() {
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
          {SAMPLE_PROS.map((pro) => (
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
