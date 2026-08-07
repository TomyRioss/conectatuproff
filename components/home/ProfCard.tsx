import Link from "next/link"
import { Star, MapPin, CheckCircle } from "lucide-react"
import { ProBadge } from "@/components/ui/ProBadge"

export type ProfCardData = {
  slug: string
  name: string
  specialty: string
  zone: string
  rating: number
  reviews: number
  priceFrom: number | null
  premium: boolean
  verified: boolean
  initials: string
  color: string
  avatarSrc?: string | null
}

export function ProfCard({ pro, variant = "default" }: { pro: ProfCardData; variant?: "default" | "dark" }) {
  const isDark = variant === "dark"

  return (
    <Link
      href={`/perfil/profesional/${pro.slug}`}
      className={`group rounded-2xl p-5 shadow-sm transition-all duration-300 block ${
        isDark
          ? "bg-white/10 border border-white/20 hover:bg-white/20"
          : "bg-white border border-gray-200 hover:shadow-md hover:border-[#6C5CE7]"
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        {pro.avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pro.avatarSrc}
            alt={pro.name}
            className={`w-14 h-14 rounded-xl object-cover shrink-0 ${pro.premium ? "ring-2 ring-brand-violet ring-offset-2" : ""}`}
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0 ${pro.premium ? "ring-2 ring-brand-violet ring-offset-2" : ""}`}
            style={{ backgroundColor: pro.color }}
          >
            {pro.initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-base leading-tight ${isDark ? "text-white" : "text-[#1A1A2E]"}`}>
              {pro.name}
            </h3>
            {pro.premium && <ProBadge className="shrink-0" />}
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>{pro.specialty}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-1 ${isDark ? "text-white/60" : "text-[#6B7280]"}`}>
          <MapPin size={13} />
          <span className="truncate">{pro.zone}</span>
        </div>
        <div className={`flex items-center gap-1 font-medium ${isDark ? "text-white" : "text-[#6C5CE7]"}`}>
          <Star size={13} className={isDark ? "fill-white" : "fill-[#6C5CE7]"} />
          <span>{pro.rating}</span>
          <span className={`font-normal ${isDark ? "text-white/40" : "text-gray-300"}`}>({pro.reviews})</span>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t flex items-center justify-between ${isDark ? "border-white/20" : "border-gray-200"}`}>
        <div>
          <span className={`text-[10px] uppercase tracking-wide ${isDark ? "text-white/50" : "text-[#6B7280]"}`}>Desde</span>
          <p className={`font-semibold text-base ${isDark ? "text-[#1EC97E]" : "text-[#6C5CE7]"}`}>
            {pro.priceFrom != null ? `$${pro.priceFrom.toLocaleString("es-AR")}` : "Consultar"}
          </p>
        </div>
        {pro.verified && (
          <div className="flex items-center gap-1 text-[#1EC97E] text-xs">
            <CheckCircle size={13} />
            <span>Verificado</span>
          </div>
        )}
      </div>
    </Link>
  )
}
