"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X } from "lucide-react";

interface Peticion {
  id: string;
  name: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface Category {
  id: string;
  name: string;
}

export default function PeticionesPage() {
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Peticion | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleUpdate(id: string, status: "RESOLVED" | "REJECTED", opts?: { categoryId?: string }) {
    try {
      setSaving(true);
      const res = await fetch("/api/owner/peticiones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, categoryId: opts?.categoryId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al actualizar petición");
      setPeticiones((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
      setCategoryId("");
      toast.success(
        status === "RESOLVED"
          ? data.created
            ? "Subcategoría creada y petición resuelta"
            : "Petición resuelta"
          : "Petición rechazada"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar petición");
    } finally {
      setSaving(false);
    }
  }

  function openResolve(p: Peticion) {
    setSelected(p);
    setCategoryId("");
    fetch("/api/owner/categorias")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
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
                onClick={() => openResolve(p)}
                className="gap-1.5 bg-brand-green text-brand-dark hover:bg-brand-green/90"
              >
                <Check size={14} />
                Aceptar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceptar “{selected?.name}”</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-brand-gray">
            Elegí a qué categoría se agrega como subcategoría. Sin categoría no se crea nada.
          </p>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="">Seleccioná categoría…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => selected && handleUpdate(selected.id, "RESOLVED")}
            >
              Solo resolver
            </Button>
            <Button
              disabled={saving || !categoryId}
              onClick={() => selected && handleUpdate(selected.id, "RESOLVED", { categoryId })}
              className="bg-brand-green text-brand-dark hover:bg-brand-green/90"
            >
              {saving ? "Guardando…" : "Crear y resolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
