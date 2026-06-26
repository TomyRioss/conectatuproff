"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import ArgentinaLocationSelect from "@/components/auth/ArgentinaLocationSelect";
import { clientRegisterFormSchema, type ClientRegisterFormInput } from "@/lib/validations/auth";

const STEPS = ["Identidad", "Contacto", "Ubicación", "Contraseña"];

const STEP_FIELDS: (keyof ClientRegisterFormInput)[][] = [
  ["firstName", "lastName", "username"],
  ["email", "phone"],
  ["province", "municipality"],
  ["password", "confirmPassword"],
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterFormInput>({ resolver: zodResolver(clientRegisterFormSchema) });

  const username = watch("username") ?? "";

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (username.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/register/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  }, [username]);

  async function next() {
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;
    setStep((s) => s + 1);
  }

  async function onSubmit(data: ClientRegisterFormInput) {
    try {
      const { confirmPassword, province, municipality, ...rest } = data;
      const payload = { ...rest, location: `${province}, ${municipality}` };
      const res = await fetch("/api/register/cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (res.status === 409) {
        if (body.error === "USERNAME_TAKEN") {
          setError("username", { message: "Este nombre de usuario ya está en uso" });
          setStep(0);
        } else {
          setError("email", { message: "Este email ya está registrado" });
          setStep(1);
        }
        return;
      }

      if (res.status === 400 && body.issues) {
        const fields = body.issues.fieldErrors as Record<string, string[]>;
        for (const [field, msgs] of Object.entries(fields)) {
          setError(field as keyof ClientRegisterFormInput, { message: msgs[0] });
        }
        return;
      }

      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      await signIn("credentials", { email: payload.email, password: payload.password, redirect: false });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    }
  }

  return (
    <AuthShell
      imageSrc="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Personas conectándose con profesionales"
      gradientClass="bg-gradient-to-br from-brand-dark/80 via-brand-dark/50 to-brand-green/60"
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark font-display">Crear cuenta</h1>
          <p className="text-brand-gray text-sm mt-1">Encontrá al profesional ideal</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-brand-green" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-brand-gray -mt-3">
          Paso {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre" placeholder="Juan" error={errors.firstName?.message} {...register("firstName")} />
                <FormField label="Apellido" placeholder="García" error={errors.lastName?.message} {...register("lastName")} />
              </div>
              <div className="flex flex-col gap-1">
                <FormField label="Nombre de usuario" placeholder="juan_garcia" error={errors.username?.message} {...register("username")} />
                {usernameStatus === "checking" && <p className="text-xs text-brand-gray">Verificando...</p>}
                {usernameStatus === "available" && <p className="text-xs text-brand-green font-medium">✓ Usuario disponible</p>}
                {usernameStatus === "taken" && <p className="text-xs text-red-500 font-medium">✗ Usuario no disponible</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register("email")} />
              <FormField label="Teléfono (opcional)" type="tel" placeholder="+54 11 1234-5678" error={errors.phone?.message} {...register("phone")} />
            </>
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

          {step === 3 && (
            <>
              <PasswordInput label="Contraseña" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />
              <PasswordInput label="Confirmar contraseña" placeholder="Repetí tu contraseña" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
            </>
          )}

          <div className={`flex gap-3 mt-2 ${step > 0 ? "justify-between" : "justify-end"}`}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-brand-dark hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 rounded-xl bg-brand-green py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-brand-green py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-gray-200 pt-5 flex flex-col gap-2 text-center text-sm text-brand-gray">
          <p>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-brand-violet font-medium hover:underline">Iniciá sesión</Link>
          </p>
          <p>
            ¿Sos profesional?{" "}
            <Link href="/profesional/register" className="text-brand-violet font-medium hover:underline">Registrate acá</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
