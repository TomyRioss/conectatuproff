import { Clock, Video as VideoIcon } from "lucide-react"
import type { WizardState } from "./types"

export function StepRevisar({ state, videoUrl }: { state: WizardState; videoUrl: string }) {
  const cover = videoUrl || state.gallery[0]?.key
  const price = Number(state.price || 0)

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-brand-dark">Revisá y publicá</h2>
      <p className="text-brand-gray text-sm mt-1">Así se va a ver tu servicio para los clientes.</p>

      <div className="mt-6 rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <div className="aspect-video bg-brand-bg relative">
          {cover ? (
            videoUrl ? (
              <video src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`} className="w-full h-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/avatar?key=${encodeURIComponent(cover)}`} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-gray text-sm">Sin portada</div>
          )}
          {videoUrl && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 text-white text-xs px-2 py-1">
              <VideoIcon size={12} /> Video
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-brand-dark">{state.title || "Sin título"}</h3>
          {state.description && (
            <p className="text-sm text-brand-gray mt-2 line-clamp-3">{state.description}</p>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xl font-bold text-brand-violet">
                {price.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
              </p>
              <p className="text-[10px] uppercase text-brand-gray">por sesión</p>
            </div>
            {state.durationMin && (
              <span className="flex items-center gap-1 text-sm text-brand-gray">
                <Clock size={14} /> {state.durationMin} min
              </span>
            )}
          </div>

          {state.frequencyType !== "UNICA" && state.frequencyCount && (
            <p className="text-xs text-brand-gray mt-2">
              {state.frequencyCount}x por {state.frequencyType === "SEMANAL" ? "semana" : "mes"}
              {state.frequencyPeriods ? ` · ${state.frequencyPeriods} ${state.frequencyType === "SEMANAL" ? "semanas" : "meses"}` : ""}
            </p>
          )}

          {state.extraSessionPrice && (
            <p className="text-xs text-brand-gray mt-2">
              Sesión extra: ${Number(state.extraSessionPrice).toLocaleString("es-AR")} ARS
            </p>
          )}

          {state.sessionPackages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Packs</p>
              <div className="flex flex-wrap gap-2">
                {state.sessionPackages.map((p, i) => (
                  <span key={i} className="text-xs border border-gray-200 rounded-full px-3 py-1 text-brand-dark">
                    {p.sessionCount} sesiones{p.frequencyType !== "UNICA" ? ` ${p.frequencyType === "SEMANAL" ? "semanales" : "mensuales"}` : ""} · ${Number(p.price || 0).toLocaleString("es-AR")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {state.faqs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">Preguntas frecuentes</p>
              <div className="flex flex-col gap-2">
                {state.faqs.map((f, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-brand-dark">{f.question}</p>
                    <p className="text-sm text-brand-gray">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
