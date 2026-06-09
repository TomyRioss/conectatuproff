"use client"

import { useState } from "react"
import { Search, MapPin, Briefcase, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  { icon: "🧘", label: "Masajes" },
  { icon: "🦶", label: "Reflexología" },
  { icon: "🏃", label: "Kinesiología" },
  { icon: "⚡", label: "Electricista" },
  { icon: "🔧", label: "Plomero" },
  { icon: "🔑", label: "Cerrajero" },
  { icon: "🧹", label: "Limpieza" },
  { icon: "💆", label: "Bienestar" },
]

export default function HeroSection() {
  const router = useRouter()
  const [barrio, setBarrio] = useState("")
  const [servicio, setServicio] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (barrio) params.set("barrio", barrio)
    if (servicio) params.set("servicio", servicio)
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <section className="bg-[#F2EDE8] pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-bold text-[#3D322E] leading-tight mb-6">
          Encontrá al{" "}
          <span className="italic text-[#AB737B]">profesional ideal</span>
          <br className="hidden sm:block" />
          {" "}para lo que necesitás.
        </h1>

        <p className="text-[#847071] text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Bienestar, oficios y más — conectamos clientes con los mejores
          profesionales de CABA y GBA.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-sm border border-[#CEC6C3] p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-12"
        >
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[#F2EDE8]">
            <MapPin size={16} className="text-[#AB737B] shrink-0" />
            <input
              type="text"
              placeholder="Barrio o zona"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              className="bg-transparent text-[#3D322E] placeholder:text-[#CEC6C3] text-sm outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[#F2EDE8]">
            <Briefcase size={16} className="text-[#AB737B] shrink-0" />
            <input
              type="text"
              placeholder="¿Qué servicio buscás?"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className="bg-transparent text-[#3D322E] placeholder:text-[#CEC6C3] text-sm outline-none w-full"
            />
          </div>

          <button
            type="submit"
            className="bg-[#AB737B] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#847071] active:bg-[#3D322E] transition-colors whitespace-nowrap"
          >
            Buscar
          </button>
        </form>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => router.push(`/buscar?servicio=${encodeURIComponent(cat.label)}`)}
              className="flex items-center gap-2 bg-white border border-[#CEC6C3] text-[#3D322E] text-sm px-4 py-2 rounded-full hover:border-[#AB737B] hover:bg-[#F2EDE8] transition-all duration-200"
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
          <button
            onClick={() => router.push("/buscar")}
            className="flex items-center gap-1 text-[#847071] text-sm px-4 py-2 hover:text-[#AB737B] transition-colors"
          >
            Ver todos <ChevronDown size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}
