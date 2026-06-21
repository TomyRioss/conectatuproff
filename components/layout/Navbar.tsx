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
    <nav className="sticky top-0 z-50 bg-[#F3F4F8]/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <Link href="/" className="text-xl font-bold text-[#1A1A2E] font-[family-name:var(--font-display)]">
          Conecta<span className="text-[#6C5CE7]">Tu</span>Proff
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[#6B7280] hover:text-[#1A1A2E] text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/profesional/login"
            className="text-sm text-[#1A1A2E] hover:text-[#6C5CE7] transition-colors underline decoration-[#1EC97E] underline-offset-2"
          >
            ¿Sos profesional?
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#1EC97E] text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            Busca ahora
          </Link>
        </div>

        <button
          className="md:hidden text-[#1A1A2E] p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#F3F4F8] border-t border-gray-200 px-4 py-5 flex flex-col gap-5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[#1A1A2E] text-sm"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <hr className="border-gray-200" />
          <Link
            href="/login"
            className="text-[#1A1A2E] text-sm"
            onClick={() => setOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/profesional/login"
            className="text-[#1A1A2E] text-sm underline decoration-[#1EC97E] underline-offset-2"
            onClick={() => setOpen(false)}
          >
            ¿Sos profesional?
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#1EC97E] text-white px-4 py-2.5 rounded-xl text-center hover:opacity-90 transition-opacity"
            onClick={() => setOpen(false)}
          >
            Busca ahora
          </Link>
        </div>
      )}
    </nav>
  )
}
