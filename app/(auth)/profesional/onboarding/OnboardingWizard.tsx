"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import FormField from "@/components/auth/FormField";
import ArgentinaLocationSelect from "@/components/auth/ArgentinaLocationSelect";
import SpecialtyAutocomplete from "@/components/auth/SpecialtyAutocomplete";

const schema = z.object({
  specialty: z.string().min(3, "Mínimo 3 caracteres"),
  phone: z.string().min(8, "Mínimo 8 caracteres"),
  province: z.string().min(1, "Requerido"),
  municipality: z.string().min(1, "Requerido"),
});
type FormInput = z.infer<typeof schema>;

const STEPS = ["Profesión", "Teléfono", "Ubicación"];

export default function OnboardingWizard({
  initialPhone,
  initialSpecialty,
  initialStep,
}: {
  initialPhone: string | null;
  initialSpecialty: string | null;
  initialStep: number;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);

  const {
    register,
    trigger,
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { phone: initialPhone ?? "", specialty: initialSpecialty ?? "", province: "", municipality: "" },
  });

  async function next() {
    if (step === 0 && !(await trigger("specialty"))) return;
    if (step === 1 && !(await trigger("phone"))) return;
    setStep((s) => s + 1);
  }

  async function submit() {
    // Valida todo: si initialStep saltó pasos, specialty/phone podrían venir vacíos.
    if (!(await trigger())) return;

    setLoading(true);
    try {
      const { specialty, phone, province, municipality } = getValues();
      const formData = new FormData();
      formData.append("specialty", specialty);
      formData.append("phone", phone);
      formData.append("location", `${province}, ${municipality}`);

      const res = await fetch("/api/profesional/onboarding", {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      toast.success("¡Perfil profesional activado!");
      await update({ role: "PROFESSIONAL" });
      router.push("/profesional/perfil");
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
      <div className="flex flex-col gap-5 sm:gap-6">
        <div>
          <h1 className="text-[22px] leading-tight sm:text-2xl font-bold text-brand-dark font-display">Modo Profesional</h1>
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

        <div className="flex flex-col gap-3 sm:gap-4">
          {step === 0 && (
            <SpecialtyAutocomplete
              value={watch("specialty")}
              onChange={(v) => setValue("specialty", v, { shouldValidate: true })}
              error={errors.specialty?.message}
            />
          )}

          {step === 1 && (
            <FormField
              label="Teléfono"
              type="tel"
              placeholder="+54 11 1234-5678"
              error={errors.phone?.message}
              {...register("phone")}
            />
          )}

          {step === 2 && (
            <ArgentinaLocationSelect
              provinciaValue={watch("province") ?? ""}
              municipioValue={watch("municipality") ?? ""}
              onProvinciaChange={(v) => setValue("province", v, { shouldValidate: true })}
              onMunicipioChange={(v) => setValue("municipality", v, { shouldValidate: true })}
              provinciaError={errors.province?.message}
              municipioError={errors.municipality?.message}
            />
          )}

          <div className="sticky bottom-0 -mx-1 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 pt-2 pb-1 lg:static lg:bg-transparent lg:p-0 flex gap-3 mt-2 justify-between">
            {step > initialStep && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, initialStep))}
                className="rounded-xl border border-gray-200 px-5 py-3.5 lg:py-3 min-h-[48px] lg:min-h-0 text-[15px] lg:text-sm font-medium text-brand-dark hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
              >
                Anterior
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-brand-violet py-3.5 lg:py-3 min-h-[48px] lg:min-h-0 text-[15px] lg:text-sm font-semibold text-white hover:opacity-90 active:scale-[0.99] transition"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="flex-1 rounded-xl bg-brand-green py-3.5 lg:py-3 min-h-[48px] lg:min-h-0 text-[15px] lg:text-sm font-semibold text-white hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
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
