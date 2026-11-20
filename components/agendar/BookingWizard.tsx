"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, Lightbulb, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration } from "@/lib/time";
import { formatPrice } from "@/lib/format-price";
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
  initialDni,
  initialVerificationComplete,
}: {
  username: string;
  professional: Professional;
  services: Service[];
  initialServiceId?: string;
  initialDni: string;
  initialVerificationComplete: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [dni, setDni] = useState(initialDni);
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [torsoPhoto, setTorsoPhoto] = useState<File | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(initialVerificationComplete);
  const [dniError, setDniError] = useState("");
  const [savingDni, setSavingDni] = useState(false);

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
      if (!res.ok) {
        toast.error(body.error === "DNI_REQUIRED"
          ? "Ingresá tu DNI para reservar."
          : "No se pudo confirmar la cita, intentá de nuevo.");
        return;
      }
      if (body.conversationId) setConversationId(body.conversationId);
      setDone(true);
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function guardarDniYContinuar() {
    const normalizedDni = dni.replace(/\D/g, "");
    if (!/^\d{7,8}$/.test(normalizedDni)) {
      setDniError("Ingresá un DNI válido de 7 u 8 números.");
      return;
    }

    setDniError("");
    setSavingDni(true);
    try {
      if (!verificationComplete && (!frontPhoto || !torsoPhoto)) {
        setDniError("Subí una foto del frente del DNI y otra donde se vea tu torso.");
        return;
      }
      if (!verificationComplete && (frontPhoto!.size > 8 * 1024 * 1024 || torsoPhoto!.size > 8 * 1024 * 1024)) {
        setDniError("Cada foto debe pesar 8 MB o menos.");
        return;
      }

      let response: Response;
      if (verificationComplete) {
        response = await fetch("/api/cliente/perfil", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni: normalizedDni }),
        });
      } else {
        const uploadImage = async (file: File, side: "front" | "torso") => {
          const uploadResponse = await fetch(`/api/configuracion/upload-url?side=${side}&contentType=${encodeURIComponent(file.type)}`);
          const uploadData = await uploadResponse.json().catch(() => null);
          if (!uploadResponse.ok) throw new Error(uploadData?.error ?? "No se pudo preparar la subida.");
          const putResponse = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!putResponse.ok) throw new Error("No se pudo subir una de las fotos.");
          return uploadData.key as string;
        };

        const [frontKey, torsoKey] = await Promise.all([
          uploadImage(frontPhoto!, "front"),
          uploadImage(torsoPhoto!, "torso"),
        ]);
        response = await fetch("/api/cliente/verificacion-reserva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni: normalizedDni, frontKey, torsoKey }),
        });
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setDniError(data?.error ?? "No se pudo guardar tu DNI. Intentá de nuevo.");
        return;
      }
      setDni(normalizedDni);
      setVerificationComplete(true);
      setStep(4);
    } catch (error) {
      setDniError(error instanceof Error ? error.message : "No se pudo enviar la verificación. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setSavingDni(false);
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
          text: "Elegí un día disponible y tocá un horario. Después, ingresá tu DNI para continuar.",
        }
      : step === 3
        ? {
            title: "Verificación",
            text: "Ingresá tu DNI y subí el frente y la foto de torso. El owner revisa las imágenes, pero podés continuar con la reserva.",
          }
        : {
            title: "Confirmación",
            text: "Revisá el servicio, el precio, el día y el horario. Si está todo bien, presioná Confirmar cita para enviar la solicitud.",
          };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          aria-label={step === 1 ? "Volver" : "Paso anterior"}
          onClick={() => (step === 1 ? router.back() : setStep((current) => (current - 1) as 1 | 2 | 3 | 4))}
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
        {["Servicio", "Fecha y hora", "Verificación", "Confirmación"].map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step === number ? "bg-brand-violet text-white" : step > number ? "bg-brand-green text-white" : "border border-gray-200 bg-white text-brand-gray"
              }`}>
                {number}
              </div>
              <span className={`text-[10px] font-medium sm:text-xs ${step === number ? "text-brand-dark" : "text-brand-gray"}`}>{label}</span>
              {number < 4 && <div className={`h-0.5 min-w-1 flex-1 rounded sm:min-w-2 ${step > number ? "bg-brand-green" : "bg-gray-200"}`} />}
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
                        <span className="shrink-0 text-right text-sm font-semibold text-brand-violet">
                          {service.price
                            ? <>{formatPrice(service.price)}</>
                            : "Consultar precio"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-brand-bg p-4 text-sm text-brand-gray">
                  Este profesional no publico servicios con precio para reservar.
                </p>
              )}
              <button
                type="button"
                disabled={!selectedService || !selectedService.price || Number(selectedService.price) <= 0}
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
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <h1 className="text-lg font-bold text-brand-dark">Verificación del cliente</h1>
              <p className="mb-5 mt-1 text-sm text-brand-gray">
                Ingresá tu DNI y subí las fotos. La revisión del owner no bloquea la reserva.
              </p>
              <label htmlFor="booking-dni" className="mb-2 block text-sm font-semibold text-brand-dark">
                DNI
              </label>
              <input
                id="booking-dni"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                value={dni}
                onChange={(event) => {
                  setDni(event.target.value.replace(/\D/g, "").slice(0, 8));
                  setDniError("");
                }}
                aria-invalid={!!dniError}
                aria-describedby={dniError ? "booking-dni-error" : "booking-dni-help"}
                placeholder="Ej. 30123456"
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-brand-dark outline-none transition focus-visible:ring-2 focus-visible:ring-brand-violet ${dniError ? "border-red-500" : "border-gray-200 focus-visible:border-brand-violet"}`}
              />
              {dniError ? (
                <p id="booking-dni-error" role="alert" className="mt-2 text-sm text-red-600">{dniError}</p>
              ) : (
                <p id="booking-dni-help" className="mt-2 text-xs text-brand-gray">Usá solo números, sin puntos.</p>
              )}
              {verificationComplete ? (
                <p className="mt-4 rounded-lg bg-brand-bg p-3 text-sm text-brand-gray">
                  Ya recibimos tus fotos para revisión. Podés continuar mientras el owner las verifica.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-dni-front" className="mb-2 block text-sm font-semibold text-brand-dark">Foto del frente del DNI</label>
                    <input
                      id="booking-dni-front"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setFrontPhoto(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-brand-gray file:mr-3 file:rounded-lg file:border-0 file:bg-brand-bg file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-dark"
                    />
                    {frontPhoto && <p className="mt-1 truncate text-xs text-brand-gray">{frontPhoto.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="booking-dni-torso" className="mb-2 block text-sm font-semibold text-brand-dark">Foto donde se vea tu torso</label>
                    <input
                      id="booking-dni-torso"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => setTorsoPhoto(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-brand-gray file:mr-3 file:rounded-lg file:border-0 file:bg-brand-bg file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-dark"
                    />
                    {torsoPhoto && <p className="mt-1 truncate text-xs text-brand-gray">{torsoPhoto.name}</p>}
                  </div>
                </div>
              )}
              <button
                type="button"
                disabled={savingDni}
                onClick={guardarDniYContinuar}
                className="mt-5 w-full rounded-full bg-brand-green py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {savingDni ? "Guardando DNI..." : "Continuar"}
              </button>
            </section>
          )}

          {step === 4 && selectedDate && selectedTime && (
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
                        {formatPrice(selectedService.price)}
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
