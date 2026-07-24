"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthAvailabilityCalendar({
  month,
  selectedDate,
  availableDates,
  loading,
  onMonthChange,
  onSelectDate,
}: {
  month: Date; // cualquier día dentro del mes visible
  selectedDate: Date | null;
  availableDates: Set<string>;
  loading: boolean;
  onMonthChange: (next: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
  const canGoPrev = !(isCurrentMonth || (year === today.getFullYear() && monthIndex < today.getMonth()) || year < today.getFullYear());

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          disabled={!canGoPrev}
          aria-label="Mes anterior"
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-brand-dark">
          {MONTHS[monthIndex]} {year}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label="Mes siguiente"
          className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-brand-dark hover:bg-brand-bg"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-brand-gray mb-1">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-gray py-6 text-center">Cargando disponibilidad...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} />;
            const key = toDateKey(d);
            const isPast = d < today;
            const available = !isPast && availableDates.has(key);
            const active = selectedDate && toDateKey(selectedDate) === key;
            return (
              <button
                key={key}
                type="button"
                disabled={!available}
                onClick={() => onSelectDate(d)}
                className={`aspect-square rounded-lg border text-sm font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? "bg-brand-violet border-brand-violet text-white"
                    : available
                    ? "bg-white border-gray-200 text-brand-dark hover:border-brand-violet/40"
                    : "bg-brand-bg border-transparent text-brand-gray/50 cursor-not-allowed"
                }`}
              >
                <span>{d.getDate()}</span>
                {available && !active && <span className="h-1 w-1 rounded-full bg-brand-green" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
