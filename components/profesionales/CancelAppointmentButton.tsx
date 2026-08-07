"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const MIN_CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000;

export function CancelAppointmentButton({ id, startAt }: { id: string; startAt: string }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const canCancel = new Date(startAt).getTime() - Date.now() >= MIN_CANCEL_NOTICE_MS;

  if (!canCancel) {
    return (
      <span className="text-xs text-brand-gray" title="Solo se puede cancelar con al menos 1 día de anticipación">
        No cancelable
      </span>
    );
  }

  async function cancel() {
    if (!confirm("¿Cancelar este turno?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error === "CANCEL_WINDOW_CLOSED" ? "Ya no se puede cancelar (menos de 1 día de anticipación)" : "No se pudo cancelar el turno");
        return;
      }
      toast.success("Turno cancelado");
      router.refresh();
    } catch {
      toast.error("No se pudo cancelar el turno");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={cancelling}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {cancelling ? "Cancelando..." : "Cancelar turno"}
    </button>
  );
}
