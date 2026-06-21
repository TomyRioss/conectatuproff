"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"
import { ProfCard, type ProfCardData } from "./ProfCard"

const BENEFITS = [
  "Perfil completo gratis para siempre",
  "Primer mes Premium sin costo",
  "Aparecé en búsquedas de CABA y GBA",
]

const CAROUSEL_PROS: ProfCardData[] = [
  { slug: "maria-g", name: "María G.", specialty: "Reflexóloga", zone: "Palermo, CABA", rating: 4.8, reviews: 93, priceFrom: 3000, premium: true, initials: "MG", color: "#1EC97E" },
  { slug: "juan-r", name: "Juan R.", specialty: "Electricista", zone: "Belgrano, CABA", rating: 4.6, reviews: 61, priceFrom: 4000, premium: false, initials: "JR", color: "#6C5CE7" },
  { slug: "carla-s", name: "Carla S.", specialty: "Masajista", zone: "San Isidro, GBA", rating: 5.0, reviews: 42, priceFrom: 2800, premium: true, initials: "CS", color: "#1EC97E" },
  { slug: "pablo-l", name: "Pablo L.", specialty: "Cerrajero", zone: "Lanús, GBA", rating: 4.5, reviews: 38, priceFrom: 3500, premium: false, initials: "PL", color: "#6B7280" },
  { slug: "ana-f", name: "Ana F.", specialty: "Kinesióloga", zone: "Recoleta, CABA", rating: 4.9, reviews: 77, priceFrom: 4500, premium: true, initials: "AF", color: "#1A1A2E" },
  { slug: "marcos-d", name: "Marcos D.", specialty: "Plomero · 24h", zone: "Quilmes, GBA", rating: 4.7, reviews: 55, priceFrom: 3800, premium: false, initials: "MD", color: "#6C5CE7" },
]

// Duplicate for seamless loop
const LOOPED = [...CAROUSEL_PROS, ...CAROUSEL_PROS]

export default function CTABanner() {
  return (
    <section
      id="para-profesionales"
      className="py-20 px-4 bg-[#6C5CE7] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div>
            <p className="text-[#1EC97E] text-sm font-medium uppercase tracking-wider mb-3">
              Para profesionales
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              ¿Sos experto en
              <br />
              tu oficio?
              <br />
              <span className="italic text-[#1EC97E]">
                Empezá a ofrecer
                <br />
                tus servicios.
              </span>
            </h2>

            <p className="text-white/70 mb-8 leading-relaxed">
              Unite a cientos de profesionales que ya usan Conecta Tu Proff
              para llegar a clientes en su zona. Sin costos de entrada.
            </p>

            <ul className="space-y-3 mb-10">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-white text-sm">
                  <CheckCircle size={16} className="text-[#1EC97E] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/registro/profesional"
                className="flex items-center justify-center gap-2 bg-[#1EC97E] text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
              >
                Crear perfil gratis
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#como-funciona"
                className="flex items-center justify-center border border-white/30 text-white px-6 py-3 rounded-xl text-sm hover:border-white/60 transition-colors"
              >
                Saber más
              </Link>
            </div>
          </div>

          {/* Vertical carousel */}
          <div className="hidden lg:block h-[420px] overflow-hidden relative">
            {/* Fade top/bottom */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#6C5CE7] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#6C5CE7] to-transparent z-10 pointer-events-none" />

            <div
              className="flex flex-col gap-4"
              style={{
                animation: "scroll-up 18s linear infinite",
              }}
            >
              {LOOPED.map((pro, i) => (
                <ProfCard key={`${pro.slug}-${i}`} pro={pro} variant="dark" />
              ))}
            </div>

            <style>{`
              @keyframes scroll-up {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  )
}
