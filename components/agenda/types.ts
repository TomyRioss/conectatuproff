export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
export type BlockedSlotReason = "VACATION" | "ABSENCE" | "PERSONAL" | "OTHER"

export interface AgendaAppointment {
  id: string
  startAt: string
  durationMin: number | null
  status: AppointmentStatus
  notes: string | null
  client: { firstName: string; lastName: string }
  service: { title: string } | null
}

export interface AgendaBlockedSlot {
  id: string
  startAt: string
  endAt: string
  reason: BlockedSlotReason
  note: string | null
}

export interface AgendaData {
  appointments: AgendaAppointment[]
  blockedSlots: AgendaBlockedSlot[]
}
