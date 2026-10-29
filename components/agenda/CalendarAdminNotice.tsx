import { AlertTriangle } from "lucide-react";

export function CalendarAdminNotice() {
  return (
    <div
      role="note"
      className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm sm:px-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <AlertTriangle size={23} strokeWidth={2.5} />
      </span>
      <p className="text-sm font-bold leading-snug text-rose-900 sm:text-base">
        ¡Recordá administrar tu calendario para que tus clientes puedan agendarte turnos!
      </p>
    </div>
  );
}
