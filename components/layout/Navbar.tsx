"use client"

import Link from "next/link"
import { Menu, X, LogOut, User, Search, MessageSquare, Heart, Sparkles, ChevronDown } from "lucide-react"
import NotificationBell from "@/components/layout/NotificationBell"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { AISearchDialog } from "@/components/ui/AISearchDialog"

function getInitials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

function AvatarButton() {
  const { data: session } = useSession()
  const initials = getInitials(session?.user?.name)
  const name = session?.user?.name
  const email = session?.user?.email
  const role = (session?.user as any)?.role
  const isClient = role === "CLIENT"
  const isProfessional = role === "PROFESSIONAL"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-full bg-brand-violet text-white text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet ring-offset-2"
          aria-label="Menú de usuario"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52 bg-brand-bg border-gray-200">
        <DropdownMenuLabel className="pb-1">
          <p className="text-sm font-semibold text-brand-dark truncate">{name}</p>
          {role && (
            <p className="text-xs text-brand-violet font-medium truncate capitalize">{role}</p>
          )}
          {email && (
            <p className="text-xs text-brand-gray font-normal truncate">{email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        {isClient && (
          <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
            <Link href="/cliente/perfil" className="text-brand-dark">
              <User size={14} />
              Ver mi perfil
            </Link>
          </DropdownMenuItem>
        )}
        {isProfessional && (
          <>
            <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
              <Link href="/profesional/perfil" className="text-brand-dark">
                <User size={14} />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
              <Link href="/profesional/servicios" className="text-brand-dark">
                Servicios
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
              <Link href="/profesional/paquetes" className="text-brand-dark">
                Paquetes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
              <Link href="/profesional/agenda" className="text-brand-dark">
                Agenda
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={14} />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



type Category = { id: string; name: string; slug: string }

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const role = (session?.user as any)?.role
  const isClient = ["cliente", "client", "CLIENT"].includes(role)

  useEffect(() => {
    if (status === "unauthenticated") {
      fetch("/api/categorias")
        .then((r) => r.json())
        .then(setCategories)
        .catch(() => {})
    }
  }, [status])

  return (
    <nav className="sticky top-0 z-50 bg-[#F3F4F8]/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <Link href="/" className="text-xl font-bold text-[#1A1A2E] font-[family-name:var(--font-display)]">
          Conecta<span className="text-[#6C5CE7]">Tu</span>Proff
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="flex flex-1 items-center bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-violet/30 focus-within:border-brand-violet transition-colors">
            <div className="flex items-center justify-center px-3 self-stretch bg-brand-violet shrink-0">
              <Search size={16} className="text-white pointer-events-none" />
            </div>
            <input
              type="search"
              placeholder="Buscar profesionales, servicios..."
              className="w-full pl-3 pr-3 py-2.5 bg-transparent text-sm text-brand-dark placeholder:text-brand-gray/70 focus:outline-none"
            />
            <button
              onClick={() => setAiOpen(true)}
              aria-label="Buscar con IA"
              className="mr-2 p-1 text-brand-violet hover:opacity-70 transition-opacity shrink-0"
            >
              <Sparkles size={16} />
            </button>
          </div>
        </div>
        <AISearchDialog open={aiOpen} onOpenChange={setAiOpen} />

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1 mr-1">
            {isLoggedIn ? (
              <>
                <NotificationBell />
                <button aria-label="Mensajes" className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors">
                  <MessageSquare size={20} />
                </button>
                <button aria-label="Favoritos" className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors">
                  <Heart size={20} />
                </button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-sm font-medium text-brand-dark hover:text-brand-violet transition-colors px-2 py-1.5 rounded-xl hover:bg-white">
                    Explorar
                    <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-brand-bg border-gray-200">
                  {categories.length === 0 ? (
                    <DropdownMenuLabel className="text-brand-gray text-xs">Cargando...</DropdownMenuLabel>
                  ) : (
                    categories.map((cat) => (
                      <DropdownMenuItem key={cat.id} asChild className="cursor-pointer text-brand-dark">
                        <Link href={`/buscar?categoria=${cat.slug}`}>{cat.name}</Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : isLoggedIn ? (
            <>
              {isClient && (
                <Link
                  href="/profesional/onboarding"
                  className="text-sm font-semibold text-brand-violet relative after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-brand-green after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300"
                >
                  Modo Profesional
                </Link>
              )}
              <AvatarButton />
</>
          ) : (
            <>
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
            </>
          )}
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
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
            <input
              type="search"
              placeholder="Buscar profesionales, servicios..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm text-brand-dark placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button aria-label="Mensajes" className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors">
              <MessageSquare size={20} />
            </button>
            <button aria-label="Favoritos" className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors">
              <Heart size={20} />
            </button>
          </div>
          <hr className="border-gray-200" />
          {isLoggedIn ? (
            <>
              {isClient && (
                <Link
                  href="/cliente/perfil"
                  className="text-[#1A1A2E] text-sm flex items-center gap-2"
                  onClick={() => setOpen(false)}
                >
                  <User size={14} />
                  Ver mi perfil
                </Link>
              )}
              <button
                className="text-sm text-red-600 text-left"
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }) }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </nav>
  )
}
