"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import DniUpload from "@/components/auth/DniUpload";
import ArgentinaLocationSelect from "@/components/auth/ArgentinaLocationSelect";
import { professionalRegisterFormSchema, type ProfessionalRegisterFormInput } from "@/lib/validations/auth";

const STEPS = [
  { label: "Datos básicos" },
  { label: "Teléfono" },
  { label: "DNI" },
  { label: "Foto frente" },
  { label: "Foto reverso" },
];

const STEP_FIELDS: (keyof ProfessionalRegisterFormInput)[][] = [
  ["firstName", "lastName", "username", "email", "password", "confirmPassword"],
  ["phone", "province", "municipality"],
  ["dni"],
  [],
  [],
];

export default function ProfessionalRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [dniErrors, setDniErrors] = useState({ front: "", back: "" });

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalRegisterFormInput>({ resolver: zodResolver(professionalRegisterFormSchema) });

  async function next() {
    const fields = STEP_FIELDS[step];
    if (step === 3) {
      if (!dniFront) { setDniErrors((e) => ({ ...e, front: "Requerido" })); return; }
      setDniErrors((e) => ({ ...e, front: "" }));
      setStep((s) => s + 1);
      return;
    }
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  }

  function prev() {
    setStep((s) => s - 1);
  }

  async function onSubmit(data: ProfessionalRegisterFormInput) {
    if (!dniBack) { setDniErrors((e) => ({ ...e, back: "Requerido" })); return; }
    setDniErrors((e) => ({ ...e, back: "" }));

    try {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("phone", data.phone);
      formData.append("dni", String(data.dni));
      formData.append("location", `${data.province}, ${data.municipality}`);
      formData.append("dniFront", dniFront!);
      formData.append("dniBack", dniBack);

      const res = await fetch("/api/register/profesional", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();

      if (res.status === 409) {
        if (body.error === "USERNAME_TAKEN") {
          setError("username", { message: "Este nombre de usuario ya está en uso" });
        } else {
          setError("email", { message: "Este email ya está registrado" });
        }
        setStep(0);
        return;
      }

      if (res.status === 400 && body.issues) {
        const fields = body.issues.fieldErrors as Record<string, string[]>;
        for (const [field, msgs] of Object.entries(fields)) {
          if (field === "dniFront") setDniErrors((e) => ({ ...e, front: msgs[0] }));
          else if (field === "dniBack") setDniErrors((e) => ({ ...e, back: msgs[0] }));
          else setError(field as keyof ProfessionalRegisterFormInput, { message: msgs[0] });
        }
        return;
      }

      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      router.push("/pendiente");
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                i <= step ? "bg-brand-violet" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-brand-gray -mt-3">
        Paso {step + 1} de {STEPS.length} — {STEPS[step].label}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Step 0: datos básicos */}
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Nombre"
                placeholder="Ana"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <FormField
                label="Apellido"
                placeholder="López"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>
            <FormField
              label="Nombre de usuario"
              placeholder="ana_lopez"
              error={errors.username?.message}
              {...register("username")}
            />
            <FormField
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordInput
              label="Confirmar contraseña"
              placeholder="Repetí tu contraseña"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </>
        )}

        {/* Step 1: teléfono + ubicación */}
        {step === 1 && (
          <>
            <FormField
              label="Teléfono"
              type="tel"
              placeholder="+54 11 1234-5678"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <ArgentinaLocationSelect
              provinciaValue={watch("province") ?? ""}
              municipioValue={watch("municipality") ?? ""}
              onProvinciaChange={(v) => setValue("province", v, { shouldValidate: true })}
              onMunicipioChange={(v) => setValue("municipality", v, { shouldValidate: true })}
              provinciaError={errors.province?.message}
              municipioError={errors.municipality?.message}
            />
          </>
        )}

        {/* Step 2: DNI número */}
        {step === 2 && (
          <FormField
            label="DNI"
            type="text"
            placeholder="12345678"
            error={errors.dni?.message}
            {...register("dni")}
          />
        )}

        {/* Step 3: foto frente */}
        {step === 3 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-brand-gray">
              Sacá una foto clara del frente de tu DNI.
            </p>
            <DniUpload
              label="DNI — Frente"
              onChange={setDniFront}
              error={dniErrors.front}
            />
          </div>
        )}

        {/* Step 4: foto reverso */}
        {step === 4 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-brand-gray">
              Ahora el reverso de tu DNI.
            </p>
            <DniUpload
              label="DNI — Reverso"
              onChange={setDniBack}
              error={dniErrors.back}
            />
          </div>
        )}

        {/* Navigation */}
        <div className={`flex gap-3 mt-2 ${step > 0 ? "justify-between" : "justify-end"}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={prev}
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-brand-violet py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting ? "Enviando solicitud..." : "Solicitar registro"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
