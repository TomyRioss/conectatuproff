"use client"

import { useState, useRef, useCallback } from "react"
import { MapPin, Briefcase, ChevronDown, ChevronRight, Sparkles, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Props = {
  subcategories: { name: string; slug: string }[]
}

export default function HeroSection({ subcategories }: Props) {
  const router = useRouter()
  const [barrio, setBarrio] = useState("")
  const [servicio, setServicio] = useState("")
  const [aiOpen, setAiOpen] = useState(false)
  const [aiQuery, setAiQuery] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    scrollRef.current!.style.cursor = "grabbing"
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollRef.current!.scrollLeft = scrollLeft.current - (x - startX.current)
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = "grab"
  }, [])

  function scrollCategories() {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (barrio) params.set("barrio", barrio)
    if (servicio) params.set("servicio", servicio)
    router.push(`/buscar?${params.toString()}`)
  }

  function handleAiSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!aiQuery.trim()) return
    setAiOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(aiQuery.trim())}`)
  }

  return (
    <section className="relative overflow-hidden pt-16 pb-20 px-4 min-h-[480px]">
      {/* Video background */}
      <video
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#1A1A2E]/60" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Encontrá al{" "}
          <span className="italic text-[#1EC97E]">profesional ideal</span>
          <br className="hidden sm:block" />
          {" "}para lo que necesitás.
        </h1>

        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Bienestar, oficios y más — conectamos clientes con los mejores
          profesionales de CABA y GBA.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-12"
        >
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-[#F3F4F8]">
            <Briefcase size={16} className="text-[#1EC97E] shrink-0" />
            <input
              type="text"
              placeholder="¿Qué servicio buscás?"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className="bg-transparent text-[#1A1A2E] placeholder:text-gray-300 text-sm outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-[160px] shrink-0 px-3 py-2 rounded-xl bg-[#F3F4F8]">
            <MapPin size={16} className="text-[#1EC97E] shrink-0" />
            <input
              type="text"
              placeholder="Zona"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              className="bg-transparent text-[#1A1A2E] placeholder:text-gray-300 text-sm outline-none w-full"
            />
          </div>

          <div className="flex gap-2 sm:flex-row flex-col">
            <button
              type="submit"
              className="bg-[#1EC97E] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 active:bg-[#1A1A2E] transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-[#6C5CE7] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors whitespace-nowrap"
            >
              <Sparkles size={14} />
              Buscar con IA
            </button>
          </div>
        </form>

        {/* Categories */}
        <div className="relative flex items-center max-w-3xl mx-auto">
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200 select-none"
            style={{ scrollbarWidth: "none", cursor: "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <div className="flex items-center gap-1 px-3 py-2 w-max">
              {subcategories.map((sub) => (
                <button
                  key={sub.slug}
                  onClick={() => router.push(`/buscar?categoria=${encodeURIComponent(sub.slug)}`)}
                  className="flex flex-col items-center gap-1.5 text-[#1A1A2E] text-xs px-5 py-2.5 rounded-xl hover:bg-[#F3F4F8] transition-all duration-200 whitespace-nowrap min-w-[72px]"
                >
                  <Tag size={18} className="text-[#1EC97E]" />
                  <span>{sub.name}</span>
                </button>
              ))}
              <div className="w-px h-8 bg-gray-200 mx-1 shrink-0" />
              <button
                onClick={() => router.push("/buscar")}
                className="flex flex-col items-center gap-1.5 text-[#6B7280] text-xs px-5 py-2.5 rounded-xl hover:bg-[#F3F4F8] hover:text-[#6C5CE7] transition-colors whitespace-nowrap min-w-[72px]"
              >
                <ChevronDown size={18} />
                <span>Ver todos</span>
              </button>
            </div>
          </div>
          <div className="absolute right-0 flex items-center justify-end w-20 h-full pointer-events-none rounded-r-2xl overflow-hidden">
            <div className="bg-gradient-to-l from-white via-white/80 to-transparent w-20 h-full" />
          </div>
          <button
            onClick={scrollCategories}
            className="absolute right-1 flex items-center justify-center w-7 h-full text-[#6B7280] hover:text-[#6C5CE7] transition-colors z-10"
            aria-label="Ver más categorías"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* AI Search Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-[#1A1A2E] px-6 pt-6 pb-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-white text-lg">
                <div className="w-8 h-8 rounded-lg bg-[#6C5CE7] flex items-center justify-center shrink-0">
                  <Sparkles size={15} className="text-white" />
                </div>
                Buscar con IA
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/60 text-sm mt-2 ml-[42px]">
              Describí lo que necesitás y encontramos al profesional ideal.
            </p>
          </div>

          {/* Body */}
          <form onSubmit={handleAiSearch} className="px-6 py-5 flex flex-col gap-4 bg-white">
            <textarea
              autoFocus
              rows={4}
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ej: Necesito un masajista en Palermo que atienda fines de semana y tenga experiencia con deportistas..."
              className="w-full rounded-xl border border-gray-200 bg-[#F3F4F8] px-4 py-3 text-sm text-[#1A1A2E] placeholder:text-gray-400 outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 focus:bg-white resize-none transition-colors"
            />
            <button
              type="submit"
              disabled={!aiQuery.trim()}
              className="w-full bg-[#6C5CE7] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#5a4bd1] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Buscar profesional
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
