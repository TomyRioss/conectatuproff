"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface Peticion {
  id: string;
  name: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

export default function PeticionesPage() {
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/peticiones")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPeticiones(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id: string, status: "RESOLVED" | "REJECTED") {
    try {
      const res = await fetch("/api/owner/peticiones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al actualizar petición");
      setPeticiones((prev) => prev.filter((p) => p.id !== id));
      toast.success(status === "RESOLVED" ? "Petición resuelta" : "Petición rechazada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar petición");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark font-display mb-6">Peticiones</h1>

      {loading && <p className="text-brand-gray text-sm">Cargando...</p>}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}
      {!loading && !error && !peticiones.length && (
        <p className="text-brand-gray text-sm">Sin peticiones pendientes.</p>
      )}

      <div className="flex flex-col gap-3">
        {peticiones.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4"
          >
            <div>
              <p className="font-medium text-brand-dark">{p.name}</p>
              <p className="text-sm text-brand-gray">
                {p.user.name ?? p.user.email}
              </p>
              <p className="text-xs text-brand-gray mt-1">
                {new Date(p.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdate(p.id, "REJECTED")}
                className="gap-1.5"
              >
                <X size={14} />
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdate(p.id, "RESOLVED")}
                className="gap-1.5 bg-brand-green text-brand-dark hover:bg-brand-green/90"
              >
                <Check size={14} />
                Resolver
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
