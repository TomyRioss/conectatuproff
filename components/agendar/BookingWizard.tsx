"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Lightbulb, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/time";
import { toast } from "sonner";
import { MonthAvailabilityCalendar } from "./MonthAvailabilityCalendar";

type Service = {
  id: string;
  title: string;
  imageUrl: string | null;
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(
    services.find((s) => s.id === initialServiceId) ?? null
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
    if (step !== 2) return;
    const t = setTimeout(() => {
      setLoadingMonth(true);
      const monthParam = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
      const durationMin = selectedService?.durationMin ?? 60;
      const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
      fetch(`/api/profesional/${professional.id}/disponibilidad/mes?month=${monthParam}&durationMin=${durationMin}${serviceParam}`)
        .then((r) => r.json())
        .then((data: { dates?: string[] }) => setAvailableDates(new Set(data.dates ?? [])))
        .catch(() => setAvailableDates(new Set()))
        .finally(() => setLoadingMonth(false));
    }, 0);
    return () => clearTimeout(t);
  }, [step, visibleMonth, selectedService, professional.id]);

  useEffect(() => {
    if (step !== 2 || !selectedDate) return;
    const t = setTimeout(() => {
      setSelectedTime(null);
      setLoadingSlots(true);
      const durationMin = selectedService?.durationMin ?? 60;
      const serviceParam = selectedService?.id ? `&serviceId=${selectedService.id}` : "";
      fetch(`/api/profesional/${professional.id}/disponibilidad?date=${toDateKey(selectedDate)}&durationMin=${durationMin}${serviceParam}`)
        .then((r) => r.json())
        .then((data) => setSlots(data.slots ?? []))
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    }, 0);
    return () => clearTimeout(t);
  }, [step, selectedDate, selectedService, professional.id]);

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
        setStep(2);
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

  const stepTip = step === 1
    ? {
        title: "Elegí tu servicio",
        text: "Tocá la tarjeta del servicio que quieras. Revisá el precio y la duración; después, elegí Continuar para seleccionar día y horario.",
      }
    : step === 2
      ? {
          title: "Elegí día y horario",
          text: "Elegí un día disponible y tocá un horario. Cuando ambos estén seleccionados, presioná Continuar para revisar la reserva.",
        }
      : {
          title: "Revisá tu reserva",
          text: "Revisá el servicio, el precio, el día y el horario. Si está todo bien, presioná Confirmar cita para enviar la solicitud.",
        };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          aria-label={step === 1 ? "Volver" : "Paso anterior"}
          onClick={() => (step === 1 ? router.back() : setStep((current) => (current === 3 ? 2 : 1)))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-dark hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="font-bold text-brand-dark">Reservá tu cita</p>
          <p className="text-xs text-brand-gray">con {professional.name}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
        <Avatar className="h-11 w-11">
          {professional.avatarSrc && <AvatarImage src={professional.avatarSrc} alt={professional.name} />}
          <AvatarFallback className="bg-brand-violet text-sm font-semibold text-white">
            {professional.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-dark">
            {professional.name}{professional.specialty ? ` · ${professional.specialty}` : ""}
          </p>
          {selectedService && <p className="truncate text-xs font-medium text-brand-violet">{selectedService.title}</p>}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {["Servicio", "Fecha y hora", "Confirmación"].map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step === number ? "bg-brand-violet text-white" : step > number ? "bg-brand-green text-white" : "border border-gray-200 bg-white text-brand-gray"
              }`}>
                {number}
              </div>
              <span className={`text-xs font-medium ${step === number ? "text-brand-dark" : "text-brand-gray"}`}>{label}</span>
              {number < 3 && <div className={`h-0.5 min-w-2 flex-1 rounded ${step > number ? "bg-brand-green" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
        <div className="min-w-0">
          {step === 1 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h1 className="text-lg font-bold text-brand-dark">Seleccionar servicio</h1>
              <p className="mb-5 mt-1 text-sm text-brand-gray">Elegí el servicio que querés agendar.</p>
              {services.length > 0 ? (
                <div className="flex flex-col gap-3" role="group" aria-label="Servicios disponibles">
                  {services.map((service) => {
                    const selected = selectedService?.id === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedDate(null);
                          setSelectedTime(null);
                        }}
                        className={`flex min-h-[76px] items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet ${
                          selected ? "border-brand-violet bg-brand-violet/5" : "border-gray-200 hover:border-brand-violet/40"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          {service.imageUrl && (
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/api/avatar?key=${encodeURIComponent(service.imageUrl)}`} alt="" className="h-full w-full object-cover" />
                            </span>
                          )}
                          <span className="min-w-0">
                          <span className="block text-sm font-semibold text-brand-dark">{service.title}</span>
                          <span className="mt-1 block text-xs text-brand-gray">{formatDuration(service.durationMin)}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-brand-violet">
                          {service.price
                            ? Number(service.price).toLocaleString("es-AR", { style: "currency", currency: service.currency })
                            : "Consultar precio"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-brand-bg p-4 text-sm text-brand-gray">
                  Este profesional todavía no publicó servicios. Podés continuar con una consulta general.
                </p>
              )}
              <button
                type="button"
                disabled={services.length > 0 && !selectedService}
                onClick={() => setStep(2)}
                className="mt-5 w-full rounded-full bg-brand-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h1 className="mb-1 text-lg font-bold text-brand-dark">Elegí día y horario</h1>
              {selectedService && <p className="mb-4 text-sm text-brand-gray">{selectedService.title}</p>}
              <p className="mb-2 text-sm font-semibold text-brand-dark">Elegí un día</p>
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
                  <p className="mb-2 mt-5 text-sm font-semibold text-brand-dark">Horarios disponibles</p>
                  {loadingSlots ? (
                    <p className="text-sm text-brand-gray">Cargando horarios...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-brand-gray">No hay horarios disponibles ese día.</p>
                  ) : (
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {slots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                            selectedTime === time ? "border-brand-violet bg-brand-violet text-white" : "border-gray-200 bg-white text-brand-dark hover:border-brand-violet/40"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="mt-4 w-full rounded-full bg-brand-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </section>
          )}

          {step === 3 && selectedDate && selectedTime && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="px-5 py-4">
                <p className="text-lg font-bold text-brand-dark">{selectedService?.title ?? "Consulta general"}</p>
              </div>
              <div className="divide-y divide-gray-100 px-5">
                {selectedService?.price && (
                  <div className="flex items-center gap-3 py-4">
                    <span className="text-lg font-bold text-brand-violet">$</span>
                    <div>
                      <p className="text-xs font-medium text-brand-gray">Precio</p>
                      <p className="text-sm font-semibold text-brand-dark">
                        {Number(selectedService.price).toLocaleString("es-AR", { style: "currency", currency: selectedService.currency })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 py-4">
                  <Clock size={18} className="text-brand-violet" />
                  <div>
                    <p className="text-xs font-medium text-brand-gray">Duración</p>
                    <p className="text-sm font-semibold text-brand-dark">{selectedService?.durationMin ? formatDuration(selectedService.durationMin) : "1 hora"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-4">
                  <Calendar size={18} className="text-brand-violet" />
                  <div>
                    <p className="text-xs font-medium text-brand-gray">Fecha y hora</p>
                    <p className="text-sm font-semibold text-brand-dark">
                      {DOW_LONG[selectedDate.getDay()]} {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]} · {selectedTime} hs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-4">
                  <User size={18} className="text-brand-violet" />
                  <div>
                    <p className="text-xs font-medium text-brand-gray">Profesional</p>
                    <p className="text-sm font-semibold text-brand-dark">
                      {professional.name}{professional.location ? ` · ${professional.location}` : ""}
                    </p>
                  </div>
                </div>
              </div>
              {selectedService?.price && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-brand-bg px-5 py-4">
                  <span className="text-sm font-semibold text-brand-dark">Total</span>
                  <span className="text-xl font-bold text-brand-violet">
                    {Number(selectedService.price).toLocaleString("es-AR", { style: "currency", currency: selectedService.currency })}
                  </span>
                </div>
              )}
              <div className="flex gap-3 p-5 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={confirmar}
                  className="flex-1 rounded-full bg-brand-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Confirmando..." : "Confirmar cita"}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="rounded-2xl border border-brand-violet/15 bg-white p-5 lg:sticky lg:top-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-violet/10 text-brand-violet">
            <Lightbulb size={19} />
          </div>
          <h2 className="text-sm font-bold text-brand-dark">{stepTip.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-gray">{stepTip.text}</p>
        </aside>
      </div>
    </div>
  );
}
