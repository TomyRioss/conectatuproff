"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import FormField from "@/components/auth/FormField";
import DniUpload from "@/components/auth/DniUpload";

const schema = z.object({
  phone: z.string().min(8, "Mínimo 8 caracteres"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI inválido"),
});
type FormInput = z.infer<typeof schema>;

const STEPS = ["Teléfono", "DNI", "Foto frente", "Foto reverso"];

export default function OnboardingWizard({
  initialPhone,
  initialStep,
}: {
  initialPhone: string | null;
  initialStep: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [dniErrors, setDniErrors] = useState({ front: "", back: "" });
  const [loading, setLoading] = useState(false);

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { phone: initialPhone ?? "" },
  });

  async function next() {
    if (step === 0) {
      const ok = await trigger("phone");
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await trigger("dni");
      if (!ok) return;
    }
    if (step === 2) {
      if (!dniFront) { setDniErrors((e) => ({ ...e, front: "Requerido" })); return; }
      setDniErrors((e) => ({ ...e, front: "" }));
    }
    setStep((s) => s + 1);
  }

  async function submit() {
    if (!dniBack) { setDniErrors((e) => ({ ...e, back: "Requerido" })); return; }
    setDniErrors((e) => ({ ...e, back: "" }));

    setLoading(true);
    try {
      const { phone, dni } = getValues();
      const formData = new FormData();
      formData.append("phone", phone);
      formData.append("dni", dni);
      formData.append("dniFront", dniFront!);
      formData.append("dniBack", dniBack);

      const res = await fetch("/api/profesional/onboarding", {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      toast.success("¡Perfil profesional activado!");
      router.push("/");
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      imageSrc="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Profesional en su trabajo"
      gradientClass="bg-gradient-to-br from-brand-dark/80 via-brand-dark/50 to-brand-violet/60"
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-display">Modo Profesional</h1>
          <p className="text-brand-gray text-sm mt-1">Completá tu perfil para activarlo</p>
        </div>

        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-brand-violet" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-brand-gray -mt-3">
          Paso {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>

        <div className="flex flex-col gap-4">
          {step === 0 && (
            <FormField
              label="Teléfono"
              type="tel"
              placeholder="+54 11 1234-5678"
              error={errors.phone?.message}
              {...register("phone")}
            />
          )}

          {step === 1 && (
            <FormField
              label="DNI"
              type="text"
              placeholder="12345678"
              error={errors.dni?.message}
              {...register("dni")}
            />
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-brand-gray">Sacá una foto clara del frente de tu DNI.</p>
              <DniUpload label="DNI — Frente" onChange={setDniFront} error={dniErrors.front} />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-brand-gray">Ahora el reverso de tu DNI.</p>
              <DniUpload label="DNI — Reverso" onChange={setDniBack} error={dniErrors.back} />
            </div>
          )}

          <div className={`flex gap-3 mt-2 ${step > initialStep ? "justify-between" : "justify-end"}`}>
            {step > initialStep && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, initialStep))}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-brand-dark hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-brand-violet py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-brand-green py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? "Activando..." : "Activar perfil profesional"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
