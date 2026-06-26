"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText } from "lucide-react";

const links = [
  { href: "/owner/categorias", label: "Categorías", icon: LayoutGrid },
  { href: "/owner/usuarios", label: "Usuarios", icon: Users },
  { href: "/owner/documentacion", label: "Documentación", icon: FileText },
];

export default function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-brand-dark flex flex-col py-6 px-3 gap-1 shrink-0">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
        Panel Owner
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-brand-green text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
