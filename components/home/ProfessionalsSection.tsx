import Link from "next/link"
import { Star, MapPin, CheckCircle } from "lucide-react"

const SAMPLE_PROS = [
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
    color: "#B4898F",
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
    color: "#82987F",
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
    color: "#AA9468",
  },
]

export default function ProfessionalsSection() {
  return (
    <section id="servicios" className="py-20 px-4 bg-[#F2EDE8]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#AB737B] text-sm font-medium uppercase tracking-wider mb-2">
              Destacados
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[#3D322E]">
              Profesionales verificados
              <br className="hidden sm:block" /> en tu zona
            </h2>
          </div>
          <Link
            href="/buscar"
            className="hidden sm:block text-sm text-[#847071] hover:text-[#AB737B] transition-colors border-b border-[#CEC6C3] hover:border-[#AB737B] pb-0.5"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_PROS.map((pro) => (
            <ProfessionalCard key={pro.slug} pro={pro} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/buscar"
            className="text-sm text-[#847071] hover:text-[#AB737B] transition-colors"
          >
            Ver todos los profesionales →
          </Link>
        </div>
      </div>
    </section>
  )
}

type Pro = (typeof SAMPLE_PROS)[0]

function ProfessionalCard({ pro }: { pro: Pro }) {
  return (
    <Link
      href={`/profesionales/${pro.slug}`}
      className="group bg-[#E3DDD9] border border-[#CEC6C3] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#B4898F] transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar placeholder */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
          style={{ backgroundColor: pro.color }}
        >
          {pro.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#3D322E] text-base leading-tight">
              {pro.name}
            </h3>
            {pro.premium && (
              <span className="text-[10px] bg-[#AB737B] text-white px-2 py-0.5 rounded-full font-medium shrink-0">
                Premium
              </span>
            )}
          </div>
          <p className="text-[#847071] text-sm mt-0.5">{pro.specialty}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-[#847071]">
          <MapPin size={13} />
          <span className="truncate">{pro.zone}</span>
        </div>
        <div className="flex items-center gap-1 text-[#AA9468] font-medium">
          <Star size={13} className="fill-[#AA9468]" />
          <span>{pro.rating}</span>
          <span className="text-[#CEC6C3] font-normal">({pro.reviews})</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#CEC6C3] flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#847071] uppercase tracking-wide">Desde</span>
          <p className="text-[#AA9468] font-semibold text-base">
            ${pro.priceFrom.toLocaleString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[#82987F] text-xs">
          <CheckCircle size={13} />
          <span>Verificado</span>
        </div>
      </div>
    </Link>
  )
}
