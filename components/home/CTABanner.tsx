import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"

const BENEFITS = [
  "Perfil completo gratis para siempre",
  "Primer mes Premium sin costo",
  "Aparecé en búsquedas de CABA y GBA",
]

export default function CTABanner() {
  return (
    <section
      id="para-profesionales"
      className="py-20 px-4 bg-[#3D322E] relative overflow-hidden"
    >
      {/* Decorative blob */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #AB737B, transparent)" }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #82987F, transparent)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div>
            <p className="text-[#BF9EA1] text-sm font-medium uppercase tracking-wider mb-3">
              Para profesionales
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F2EDE8] leading-tight mb-6">
              ¿Sos experto en
              <br />
              tu oficio?
              <br />
              <span className="italic text-[#B4898F]">
                Empezá a ofrecer
                <br />
                tus servicios.
              </span>
            </h2>

            <p className="text-[#BCA67D] mb-8 leading-relaxed">
              Unite a cientos de profesionales que ya usan Conecta Tu Proff
              para llegar a clientes en su zona. Sin costos de entrada.
            </p>

            <ul className="space-y-3 mb-10">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[#F2EDE8] text-sm">
                  <CheckCircle size={16} className="text-[#97AC94] shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/registro/profesional"
                className="flex items-center justify-center gap-2 bg-[#AB737B] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#B4898F] transition-colors"
              >
                Crear perfil gratis
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#como-funciona"
                className="flex items-center justify-center border border-[#847071] text-[#F2EDE8] px-6 py-3 rounded-xl text-sm hover:border-[#BF9EA1] transition-colors"
              >
                Saber más
              </Link>
            </div>
          </div>

          {/* Visual side — placeholder pros grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { initials: "MG", color: "#B4898F", name: "María G.", role: "Reflexóloga" },
              { initials: "JR", color: "#82987F", name: "Juan R.", role: "Electricista" },
              { initials: "CS", color: "#AA9468", name: "Carla S.", role: "Masajista" },
              { initials: "PL", color: "#847071", name: "Pablo L.", role: "Cerrajero" },
            ].map((p) => (
              <div
                key={p.initials}
                className="bg-[#F2EDE8]/10 border border-[#847071]/30 rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.initials}
                </div>
                <div>
                  <p className="text-[#F2EDE8] text-sm font-medium leading-tight">{p.name}</p>
                  <p className="text-[#847071] text-xs">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
