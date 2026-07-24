"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MonthAvailabilityCalendar } from "./MonthAvailabilityCalendar";

type Service = {
  id: string;
  title: string;
  price: string | null;
  currency: string;
  durationMin: number | null;
  serviceType: string | null;
};

type Professional = {
  id: string;
  name: string;
  specialty: string | null;
  location: string | null;
  avatarSrc: string | null;
};

const DOW_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingWizard({
  username,
  professional,
  services,
  initialServiceId,
}: {
  username: string;
  professional: Professional;
  services: Service[];
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialServiceId) ?? services[0] ?? null
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMonth(true);
    const monthParam = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
    const durationMin = selectedService?.durationMin ?? 60;
    const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
    fetch(`/api/profesional/${professional.id}/disponibilidad/mes?month=${monthParam}&durationMin=${durationMin}${serviceParam}`)
      .then((r) => r.json())
      .then((data: { dates?: string[] }) => setAvailableDates(new Set(data.dates ?? [])))
      .catch(() => setAvailableDates(new Set()))
      .finally(() => setLoadingMonth(false));
  }, [visibleMonth, selectedService, professional.id]);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedTime(null);
    setLoadingSlots(true);
    const durationMin = selectedService?.durationMin ?? 60;
    const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
    fetch(`/api/profesional/${professional.id}/disponibilidad?date=${toDateKey(selectedDate)}&durationMin=${durationMin}${serviceParam}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, selectedService, professional.id]);

  async function confirmar() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    const [h, m] = selectedTime.split(":").map(Number);
    const startAt = new Date(selectedDate);
    startAt.setHours(h, m, 0, 0);

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: professional.id, serviceId: selectedService?.id, startAt: startAt.toISOString() }),
      });
      const body = await res.json();
      if (res.status === 409) {
        toast.error("Ese horario ya no está disponible, elegí otro.");
        setStep(1);
        setSelectedTime(null);
        return;
      }
      if (res.ok && body.conversationId) setConversationId(body.conversationId);
      if (!res.ok) {
        toast.error("No se pudo confirmar la cita, intentá de nuevo.");
        return;
      }
      setDone(true);
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h1 className="text-xl font-bold text-brand-dark mb-2">¡Cita confirmada!</h1>
        <p className="text-sm text-brand-gray mb-6">
          {professional.name} recibió tu reserva para el{" "}
          <b>
            {DOW_LONG[selectedDate!.getDay()]} {selectedDate!.getDate()} de {MONTHS[selectedDate!.getMonth()]}
          </b>{" "}
          a las <b>{selectedTime} hs</b>.
        </p>
        <div className="flex flex-col gap-2 items-center">
          {conversationId && (
            <Link
              href={`/cliente/mensajes/${conversationId}`}
              className="inline-block rounded-full bg-brand-violet text-white text-sm font-medium px-6 py-2.5 hover:opacity-90 transition-opacity"
            >
              Enviar mensaje a {professional.name}
            </Link>
          )}
          <Link
            href={`/perfil/profesional/${username}`}
            className="inline-block text-sm font-medium text-brand-dark px-6 py-2.5 hover:text-brand-violet transition-colors"
          >
            Volver al perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => (step === 1 ? router.back() : setStep(1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-dark hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="font-bold text-brand-dark">Reservá tu cita</p>
          <p className="text-xs text-brand-gray">con {professional.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3 mb-4">
        <Avatar className="h-11 w-11">
          {professional.avatarSrc && <AvatarImage src={professional.avatarSrc} alt={professional.name} />}
          <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
            {professional.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark truncate">
            {professional.name}
            {professional.specialty ? ` · ${professional.specialty}` : ""}
          </p>
          {selectedService && <p className="text-xs text-brand-violet font-medium truncate">{selectedService.title}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === n ? "bg-brand-violet text-white" : step > n ? "bg-brand-green text-white" : "bg-white border border-gray-200 text-brand-gray"
              }`}
            >
              {n}
            </div>
            <span className={`text-xs font-medium ${step === n ? "text-brand-dark" : "text-brand-gray"}`}>
              {n === 1 ? "Fecha y hora" : "Confirmación"}
            </span>
            {n === 1 && <div className={`h-0.5 flex-1 rounded ${step > 1 ? "bg-brand-green" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {services.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-brand-dark mb-2">Servicio</p>
              <div className="flex flex-col gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(s);
                      setSelectedDate(null);
                    }}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                      selectedService?.id === s.id ? "border-brand-violet bg-brand-violet/5" : "border-gray-200 hover:border-brand-violet/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-brand-dark">{s.title}</p>
                    <p className="text-xs text-brand-gray">
                      {s.durationMin ? `${s.durationMin} min` : ""}
                      {s.price ? ` · $${Number(s.price).toLocaleString("es-AR")}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm font-semibold text-brand-dark mb-2">Elegí un día</p>
          <MonthAvailabilityCalendar
            month={visibleMonth}
            selectedDate={selectedDate}
            availableDates={availableDates}
            loading={loadingMonth}
            onMonthChange={setVisibleMonth}
            onSelectDate={setSelectedDate}
          />

          {selectedDate && (
            <>
              <p className="text-sm font-semibold text-brand-dark mt-5 mb-2">Horarios disponibles</p>
              {loadingSlots ? (
                <p className="text-sm text-brand-gray">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-brand-gray">No hay horarios disponibles ese día.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                        selectedTime === t ? "bg-brand-violet border-brand-violet text-white" : "bg-white border-gray-200 text-brand-dark hover:border-brand-violet/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(2)}
            className="w-full mt-4 rounded-full bg-brand-green text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && selectedDate && selectedTime && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="bg-brand-dark px-5 py-4 text-white">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-2.5 py-1 mb-2">
              Tu cita
            </span>
            <p className="text-lg font-bold">{selectedService?.title ?? "Consulta general"}</p>
          </div>
          <div className="px-5 divide-y divide-gray-100">
            <div className="flex items-center gap-3 py-4">
              <Clock size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Duración</p>
                <p className="text-sm font-semibold text-brand-dark">{selectedService?.durationMin ?? 60} minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <Calendar size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Fecha y hora</p>
                <p className="text-sm font-semibold text-brand-dark">
                  {DOW_LONG[selectedDate.getDay()]} {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]} · {selectedTime} hs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <User size={18} className="text-brand-violet" />
              <div>
                <p className="text-xs text-brand-gray font-medium">Profesional</p>
                <p className="text-sm font-semibold text-brand-dark">
                  {professional.name}
                  {professional.location ? ` · ${professional.location}` : ""}
                </p>
              </div>
            </div>
          </div>
          {selectedService?.price && (
            <div className="flex items-center justify-between bg-brand-bg px-5 py-4 border-t border-gray-200">
              <span className="text-sm font-semibold text-brand-dark">Total</span>
              <span className="text-xl font-bold text-brand-violet">
                {Number(selectedService.price).toLocaleString("es-AR", { style: "currency", currency: selectedService.currency })}
              </span>
            </div>
          )}
          <div className="flex gap-3 p-5 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-full border border-gray-200 text-sm font-medium text-brand-dark py-2.5 hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={confirmar}
              className="flex-1 rounded-full bg-brand-green text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Confirmando..." : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
