"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DOW_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DayRow = { enabled: boolean; startTime: string; endTime: string };

function emptyWeek(): DayRow[] {
  return DOW_LABELS.map((_, i) => ({ enabled: i >= 1 && i <= 5, startTime: "09:00", endTime: "18:00" }));
}

export function WeeklyAvailabilityDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState<DayRow[]>(emptyWeek());

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/profesional/disponibilidad")
        .then((r) => r.json())
        .then((data: { days?: { dayOfWeek: number; startTime: string; endTime: string }[] }) => {
          const next = emptyWeek().map((row) => ({ ...row, enabled: false }));
          for (const d of data.days ?? []) {
            next[d.dayOfWeek] = { enabled: true, startTime: d.startTime, endTime: d.endTime };
          }
          setWeek(next);
        })
        .catch(() => toast.error("No se pudo cargar el horario"))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  function updateDay(index: number, patch: Partial<DayRow>) {
    setWeek((w) => w.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    try {
      const days = week
        .map((row, dayOfWeek) => ({ dayOfWeek, ...row }))
        .filter((row) => row.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));

      const res = await fetch("/api/profesional/disponibilidad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Horario guardado");
      setOpen(false);
    } catch (e) {
      console.error("save weekly availability", e);
      toast.error("No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-2 border-gray-200 text-brand-dark">
          <Settings size={14} /> Configurar horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Horario semanal</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-brand-gray py-4">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {DOW_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-32 shrink-0">
                  <input
                    type="checkbox"
                    checked={week[i].enabled}
                    onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-violet focus:ring-brand-violet/30"
                  />
                  <span className="text-sm text-brand-dark">{label}</span>
                </label>
                <input
                  type="time"
                  disabled={!week[i].enabled}
                  value={week[i].startTime}
                  onChange={(e) => updateDay(i, { startTime: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark disabled:opacity-40 disabled:bg-brand-bg"
                />
                <span className="text-brand-gray text-sm">a</span>
                <input
                  type="time"
                  disabled={!week[i].enabled}
                  value={week[i].endTime}
                  onChange={(e) => updateDay(i, { endTime: e.target.value })}
                  className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-brand-dark disabled:opacity-40 disabled:bg-brand-bg"
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" onClick={save} disabled={saving || loading} className="bg-brand-green text-white hover:opacity-90">
            {saving ? "Guardando..." : "Guardar horario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
