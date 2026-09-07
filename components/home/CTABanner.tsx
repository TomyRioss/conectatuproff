import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"
import { ProfCard } from "./ProfCard"
import { getFeaturedPros } from "@/lib/featured-professionals"

const BENEFITS = [
  "Perfil completo gratis para siempre",
  "Primer mes Premium sin costo",
  "Aparecé en búsquedas de CABA y GBA",
]

export default async function CTABanner() {
  const pros = await getFeaturedPros()
  // Duplicate for seamless loop
  const looped = [...pros, ...pros]

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
                href="/profesional/login"
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
          {pros.length > 0 && (
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
                {looped.map((pro, i) => (
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
          )}
        </div>
      </div>
    </section>
  )
}
