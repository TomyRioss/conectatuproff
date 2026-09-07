import Link from "next/link"
import { MapPin, Search, Briefcase } from "lucide-react"

const COLUMNS = [
  {
    title: "Explorar",
    links: [
      { href: "/buscar", label: "Buscar profesionales" },
      { href: "/explore", label: "Explorar categorías" },
      { href: "/explore/profesionales", label: "Ver profesionales" },
      { href: "/#como-funciona", label: "Cómo funciona" },
    ],
  },
  {
    title: "Profesionales",
    links: [
      { href: "/#para-profesionales", label: "Beneficios" },
      { href: "/register/profesional", label: "Publicar servicio" },
      { href: "/profesional/login", label: "Acceso profesionales" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/login", label: "Iniciar sesión" },
      { href: "/register", label: "Crear cuenta" },
      { href: "/register/cliente", label: "Soy cliente" },
      { href: "/favoritos", label: "Mis favoritos" },
    ],
  },
]

const linkCls =
  "inline-flex items-center min-h-[44px] text-sm text-white/65 hover:text-white underline-offset-4 hover:underline hover:decoration-brand-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="h-[3px] bg-gradient-to-r from-brand-green via-brand-violet to-brand-green" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-14">
        {/* Mobile: brand + accordion */}
        <div className="lg:hidden">
          <p className="text-xl font-bold font-display">
            Conecta<span className="text-brand-violet">Tu</span>Proff
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/65 max-w-[65ch]">
            Marketplace de profesionales en CABA y GBA. Bienestar, oficios y más.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/65">
            <MapPin size={14} className="text-brand-green" aria-hidden />
            CABA y GBA · Argentina
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/buscar"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-green px-4 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Search size={16} aria-hidden />
              Busca ahora
            </Link>
            <Link
              href="/profesional/login"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-medium text-white hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              <Briefcase size={16} aria-hidden />
              Soy profesional
            </Link>
          </div>

          <nav aria-label="Footer" className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {COLUMNS.map((col) => (
              <details key={col.title} className="group">
                <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between py-3 text-xs font-semibold uppercase tracking-wider text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <span aria-hidden className="text-lg font-normal text-brand-green transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <ul className="pb-5 space-y-1">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.href}`}>
                      <Link href={l.href} className={linkCls}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>
        </div>

        {/* Desktop */}
        <div className="hidden lg:grid lg:grid-cols-[1.25fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <p className="text-2xl font-bold font-display tracking-[-0.02em]">
              Conecta<span className="text-brand-violet">Tu</span>Proff
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65 max-w-[38ch]">
              Marketplace de profesionales en CABA y GBA. Bienestar, oficios y más.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/65">
              <MapPin size={14} className="text-brand-green" aria-hidden />
              CABA y GBA · Argentina
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/buscar"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-green px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Search size={16} aria-hidden />
                Busca ahora
              </Link>
              <Link
                href="/profesional/login"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-white hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <Briefcase size={16} aria-hidden />
                Soy profesional
              </Link>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-white/70">
                {col.title}
              </p>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.href}`}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ConectaTuProff. Todos los derechos reservados.</p>
          <p>Bienestar, oficios y más · CABA y GBA</p>
        </div>
      </div>
    </footer>
  )
}
