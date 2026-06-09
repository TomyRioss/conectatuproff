import Link from "next/link"

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { href: "/buscar", label: "Buscar profesionales" },
      { href: "#como-funciona", label: "Cómo funciona" },
      { href: "/registro/profesional", label: "Publicar servicio" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { href: "/ayuda", label: "Centro de ayuda" },
      { href: "/contacto", label: "Contacto" },
      { href: "/terminos", label: "Términos y condiciones" },
    ],
  },
  {
    title: "Registro",
    links: [
      { href: "/registro/cliente", label: "Soy cliente" },
      { href: "/registro/profesional", label: "Soy profesional" },
      { href: "/login", label: "Iniciar sesión" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#3D322E] text-[#F2EDE8] py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold font-[family-name:var(--font-display)] mb-3">
              Conecta<span className="text-[#AB737B]">Tu</span>Proff
            </p>
            <p className="text-[#847071] text-sm leading-relaxed">
              Marketplace de profesionales en CABA y GBA. Bienestar, oficios y más.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[#CEC6C3] text-xs font-semibold uppercase tracking-wider mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[#847071] hover:text-[#F2EDE8] text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#847071]/30 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#847071]">
          <p>© {new Date().getFullYear()} ConectaTuProff. Todos los derechos reservados.</p>
          <p>Hecho con ♥ en Buenos Aires</p>
        </div>
      </div>
    </footer>
  )
}
