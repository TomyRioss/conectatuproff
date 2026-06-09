"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-funciona", label: "¿Cómo funciona?" },
  { href: "#para-profesionales", label: "Para profesionales" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-[#F2EDE8]/95 backdrop-blur-sm border-b border-[#CEC6C3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-[#3D322E] font-[family-name:var(--font-display)]">
          Conecta<span className="text-[#AB737B]">Tu</span>Proff
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[#847071] hover:text-[#3D322E] text-sm transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#3D322E] hover:text-[#AB737B] transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro/profesional"
            className="text-sm bg-[#AB737B] text-white px-4 py-2 rounded-xl hover:bg-[#847071] active:bg-[#3D322E] transition-colors"
          >
            Publicar servicio
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#3D322E] p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#F2EDE8] border-t border-[#CEC6C3] px-4 py-5 flex flex-col gap-5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[#3D322E] text-sm"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <hr className="border-[#CEC6C3]" />
          <Link href="/login" className="text-[#3D322E] text-sm">
            Iniciar sesión
          </Link>
          <Link
            href="/registro/profesional"
            className="text-sm bg-[#AB737B] text-white px-4 py-2.5 rounded-xl text-center hover:bg-[#847071] transition-colors"
          >
            Publicar servicio
          </Link>
        </div>
      )}
    </nav>
  )
}
