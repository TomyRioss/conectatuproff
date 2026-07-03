const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const BLOCK_REASON_LABEL: Record<string, string> = {
  VACATION: "Vacaciones",
  ABSENCE: "Ausencia",
  PERSONAL: "Personal",
  OTHER: "Otro",
};

type Availability = { dayOfWeek: number; startTime: string; endTime: string };
type BlockedSlot = { id: string; startAt: Date; endAt: Date; reason: string };

export function AgendaSummary({
  availability,
  blockedSlots,
}: {
  availability: Availability[];
  blockedSlots: BlockedSlot[];
}) {
  const byDay = new Map<number, Availability[]>();
  for (const slot of availability) {
    const list = byDay.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    byDay.set(slot.dayOfWeek, list);
  }

  if (availability.length === 0 && blockedSlots.length === 0) {
    return <p className="text-sm text-brand-gray">Todavía no cargaste tu agenda.</p>;
  }

  return (
    <div className="space-y-4">
      {availability.length > 0 && (
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const slots = byDay.get(day);
            if (!slots?.length) return null;
            return (
              <div key={day} className="flex items-center justify-between text-sm">
                <span className="text-brand-dark font-medium">{DAY_LABELS[day]}</span>
                <span className="text-brand-gray">
                  {slots.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {blockedSlots.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">
            Próximos bloqueos
          </p>
          {blockedSlots.map((block) => (
            <div key={block.id} className="flex items-center justify-between text-sm">
              <span className="text-brand-dark">
                {block.startAt.toLocaleDateString("es-AR")} – {block.endAt.toLocaleDateString("es-AR")}
              </span>
              <span className="text-brand-gray">{BLOCK_REASON_LABEL[block.reason] ?? block.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
