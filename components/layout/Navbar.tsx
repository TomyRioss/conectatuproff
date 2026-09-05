"use client"

import Link from "next/link"
import { Menu, X, LogOut, User, Search, MessageSquare, Heart, Sparkles, ChevronDown, Clock, Briefcase, Calendar, MapPin, Settings } from "lucide-react"
import NotificationBell from "@/components/layout/NotificationBell"
import MessagesInboxDropdown from "@/components/layout/MessagesInboxDropdown"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AISearchDialog } from "@/components/ui/AISearchDialog"
import { UpgradePlanDialog } from "@/components/profesionales/UpgradePlanDialog"
import { toast } from "sonner"

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("")
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

function AvatarButton() {
  const { data: session } = useSession()
  const initials = getInitials(session?.user?.name, session?.user?.email)
  const name = session?.user?.name
  const email = session?.user?.email
  const role = (session?.user as { role?: string })?.role
  const roleLabel =
    role === "PROFESSIONAL" ? "Profesional" : role === "CLIENT" ? "Cliente" : role === "OWNER" ? "Dueño" : role
  const avatarUrl = session?.user?.image ?? null
  const isClient = role === "CLIENT"
  const isProfessional = role === "PROFESSIONAL"
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-11 h-11 rounded-full bg-brand-violet text-white text-base font-semibold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet ring-offset-2 overflow-hidden relative"
            aria-label="Menú de usuario"
          >
            <span className="absolute inset-0 flex items-center justify-center select-none">{initials}</span>
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-52 bg-brand-bg border-gray-200">
          <DropdownMenuLabel className="pb-1">
            <p className="text-sm font-semibold text-brand-dark truncate">{name}</p>
            {role && (
              <p className="text-xs text-brand-violet font-medium truncate">{roleLabel}</p>
            )}
            {email && (
              <p className="text-xs text-brand-gray font-normal truncate">{email}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200" />
          {isClient && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
                <Link href="/cliente/perfil" className="text-brand-dark">
                  <User size={14} />
                  Ver mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
                <Link href="/cliente/turnos" className="text-brand-dark">
                  <Clock size={14} />
                  Mis turnos
                </Link>
              </DropdownMenuItem>
            </>
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
                  <Briefcase size={14} />
                  Servicios
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
                <Link href="/profesional/agenda" className="text-brand-dark">
                  <Calendar size={14} />
                  Agenda
                </Link>
              </DropdownMenuItem>
              {/* ponytail: "Mejora tu plan" oculto temporalmente a pedido */}
            </>
          )}
          {(isClient || isProfessional) && (
            <DropdownMenuItem asChild className="cursor-pointer gap-2 text-brand-dark">
              <Link href="/configuracion" className="text-brand-dark">
                <Settings size={14} />
                Configuración
              </Link>
            </DropdownMenuItem>
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
      {isProfessional && <UpgradePlanDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />}
    </>
  )
}



type Category = { id: string; name: string; slug: string }

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [checkingMode, setCheckingMode] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLoggedIn = status === "authenticated"
  const role = (session?.user as { role?: string })?.role
  const isClient = ["cliente", "client", "CLIENT"].includes(role ?? "")

  async function handleModoProfesional() {
    if (checkingMode) return
    setCheckingMode(true)
    try {
      const res = await fetch("/api/profesional/status")
      const data = await res.json()
      if (data.state === "verified") {
        if (role !== "PROFESSIONAL") {
          const updated = await update({ role: "PROFESSIONAL" })
          if ((updated?.user as { role?: string })?.role !== "PROFESSIONAL") {
            toast.error("No pudimos cambiar a modo profesional. Intentá de nuevo.")
            return
          }
        }
        router.push("/profesional/perfil")
        router.refresh()
      } else if (data.state === "pending") {
        setPendingOpen(true)
      } else {
        router.push("/profesional/onboarding")
      }
    } catch {
      toast.error("No pudimos verificar tu estado de profesional. Intentá de nuevo.")
    } finally {
      setCheckingMode(false)
    }
  }

  async function handleModoCliente() {
    if (checkingMode) return
    setCheckingMode(true)
    try {
      const updated = await update({ role: "CLIENT" })
      if ((updated?.user as { role?: string })?.role !== "CLIENT") {
        toast.error("No pudimos cambiar a modo cliente. Tu cuenta no tiene perfil de cliente.")
        return
      }
      router.push("/")
      router.refresh()
    } catch {
      toast.error("No pudimos cambiar de modo. Intentá de nuevo.")
    } finally {
      setCheckingMode(false)
    }
  }

  useEffect(() => {
    if (searchParams.get("pendingReview") === "1") {
      const t = setTimeout(() => setPendingOpen(true), 0)
      router.replace("/")
      return () => clearTimeout(t)
    }
  }, [searchParams, router])

  const [query, setQuery] = useState("")
  const [barrio, setBarrio] = useState("")
  const [zonas, setZonas] = useState<string[]>([])
  const submitSearch = () => {
    const q = query.trim()
    if (!q && !barrio) return
    const params = new URLSearchParams()
    if (q) params.set("servicio", q)
    if (barrio) params.set("barrio", barrio)
    router.push(`/buscar?${params.toString()}`)
  }

  useEffect(() => {
    fetch("https://apis.datos.gob.ar/georef/api/municipios?provincia=06&campos=nombre&max=135&orden=nombre")
      .then((r) => r.json())
      .then((d) => setZonas((d.municipios ?? []).map((m: { nombre: string }) => m.nombre)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      fetch("/api/categorias")
        .then((r) => r.json())
        .then(setCategories)
        .catch(() => {})
    }
  }, [status])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_auto_auto] items-center gap-6">

        <Link href="/" className="text-2xl font-bold text-[#1A1A2E] font-[family-name:var(--font-display)] shrink-0">
          Conecta<span className="text-[#6C5CE7]">Tu</span>Proff
        </Link>

        <div className="hidden md:flex items-center justify-center w-full">
          <div className="flex items-center w-full max-w-2xl h-12 bg-white border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-brand-violet/30 focus-within:border-brand-violet transition-colors">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="¿Qué servicio estás buscando hoy?"
              className="w-full h-full pl-5 pr-2 bg-transparent text-base text-brand-dark placeholder:text-brand-gray focus:outline-none"
            />
            <div className="flex items-center gap-1.5 pl-3 pr-2 border-l border-gray-200 shrink-0">
              <MapPin size={16} className="text-brand-gray shrink-0" />
              <select
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                className="h-full bg-transparent text-sm text-brand-dark outline-none max-w-[120px] appearance-none"
              >
                <option value="">Zona</option>
                {zonas.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAiOpen(true)}
              aria-label="Buscar con IA"
              className="px-2.5 text-brand-violet hover:opacity-70 transition-opacity shrink-0"
            >
              <Sparkles size={18} />
            </button>
            <button
              onClick={submitSearch}
              aria-label="Buscar"
              className="h-full px-5 bg-brand-green text-white flex items-center justify-center hover:opacity-90 transition-colors shrink-0"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <MessagesInboxDropdown />
              <Link href="/favoritos" aria-label="Favoritos" className="text-brand-gray hover:text-brand-dark transition-colors">
                <Heart size={22} />
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-base font-medium text-brand-dark hover:text-brand-violet transition-colors px-2 py-1.5 rounded-xl hover:bg-white">
                  Explorar
                  <ChevronDown size={16} />
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
        <AISearchDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          onResult={({ servicio, zona }) => {
            const params = new URLSearchParams()
            if (servicio) params.set("servicio", servicio)
            if (zona) params.set("barrio", zona)
            router.push(`/buscar?${params.toString()}`)
          }}
        />

        <div className="hidden md:flex items-center gap-3 justify-self-end">
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : isLoggedIn ? (
            <>
              {isClient && (
                <button
                  onClick={handleModoProfesional}
                  disabled={checkingMode}
                  className="text-base font-semibold text-brand-violet relative after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-brand-green after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300 cursor-pointer disabled:cursor-default disabled:opacity-60"
                >
                  Modo Profesional
                </button>
              )}
              <div className="flex items-center gap-3">
                {role === "PROFESSIONAL" && (
                  <button
                    onClick={handleModoCliente}
                    disabled={checkingMode}
                    className="text-base font-semibold text-brand-violet relative after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:bg-brand-green after:scale-x-0 after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-300 cursor-pointer disabled:cursor-default disabled:opacity-60"
                  >
                    Buscar Servicios
                  </button>
                )}
                <AvatarButton />
              </div>
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
          className="md:hidden text-[#1A1A2E] p-1 col-start-3 justify-self-end"
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Buscar profesionales, servicios..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm text-brand-dark placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href={role === "PROFESSIONAL" ? "/profesional/mensajes" : "/cliente/mensajes"}
              aria-label="Mensajes"
              className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <MessageSquare size={20} />
            </Link>
            <Link
              href="/favoritos"
              aria-label="Favoritos"
              className="p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <Heart size={20} />
            </Link>
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
              <Link
                href="/configuracion"
                className="text-[#1A1A2E] text-sm flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Settings size={14} />
                Configuración
              </Link>
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

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogContent className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center">
              <Clock size={32} className="text-brand-violet" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-brand-dark font-display leading-snug">
            ¡Ya casi sos parte de ConectaTuProff!
          </DialogTitle>
          <p className="text-brand-gray text-sm leading-relaxed">
            Recibimos tu solicitud y tus fotos del DNI. Gracias por sumarte 💚
          </p>
          <p className="text-brand-gray text-sm leading-relaxed">
            Estamos revisando tus datos y te escribimos por email dentro de las{" "}
            <span className="font-medium text-brand-dark">24 a 48 horas</span>. En breve
            vas a poder empezar a recibir clientes.
          </p>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
