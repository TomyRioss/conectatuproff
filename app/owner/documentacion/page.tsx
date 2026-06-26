"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Solicitud {
  id: string;
  firstName: string;
  lastName: string;
  dni: number | null;
  dniPhotoFront: string | null;
  dniPhotoBack: string | null;
  phone: string | null;
  location: string | null;
  user: {
    id: string;
    email: string;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
  };
}

export default function DocumentacionPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function fetchSolicitudes() {
    const res = await fetch("/api/owner/profesionales");
    if (!res.ok) { toast.error("Error al cargar solicitudes"); return; }
    setSolicitudes(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchSolicitudes(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActing(id + action);
    try {
      const res = await fetch(`/api/owner/profesionales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }
      toast.success(action === "approve" ? "Profesional aprobado" : "Profesional rechazado");
      await fetchSolicitudes();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-brand-dark">Documentación</h1>
        <p className="text-sm text-brand-gray mt-1">Solicitudes de registro de profesionales pendientes de verificación.</p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-gray">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-brand-gray">No hay solicitudes pendientes.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {solicitudes.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-brand-dark">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-brand-gray mt-0.5">{s.user.email}</p>
                  {s.dni && <p className="text-xs text-brand-gray">DNI: {s.dni.toLocaleString()}</p>}
                  {s.phone && <p className="text-xs text-brand-gray">Tel: {s.phone}</p>}
                  {s.location && <p className="text-xs text-brand-gray">Ubicación: {s.location}</p>}
                  <p className="text-xs text-brand-gray mt-1">
                    Registrado: {new Date(s.user.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(s.id, "approve")}
                    disabled={!!acting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-green hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {acting === s.id + "approve" ? "..." : "Aprobar"}
                  </button>
                  <button
                    onClick={() => handleAction(s.id, "reject")}
                    disabled={!!acting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    {acting === s.id + "reject" ? "..." : "Rechazar"}
                  </button>
                </div>
              </div>

              {/* DNI Photos */}
              <div className="flex gap-3 flex-wrap">
                {s.dniPhotoFront ? (
                  <a href={s.dniPhotoFront} target="_blank" rel="noopener noreferrer" className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.dniPhotoFront}
                      alt="DNI Frente"
                      className="w-48 h-28 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      Frente <ExternalLink size={10} />
                    </span>
                  </a>
                ) : (
                  <div className="w-48 h-28 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-brand-gray">
                    Sin foto frente
                  </div>
                )}

                {s.dniPhotoBack ? (
                  <a href={s.dniPhotoBack} target="_blank" rel="noopener noreferrer" className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.dniPhotoBack}
                      alt="DNI Dorso"
                      className="w-48 h-28 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      Dorso <ExternalLink size={10} />
                    </span>
                  </a>
                ) : (
                  <div className="w-48 h-28 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-brand-gray">
                    Sin foto dorso
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
