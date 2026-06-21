"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import DniUpload from "@/components/auth/DniUpload";
import { professionalRegisterSchema, type ProfessionalRegisterInput } from "@/lib/validations/auth";

export default function ProfessionalRegisterForm() {
  const router = useRouter();
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [dniErrors, setDniErrors] = useState({ front: "", back: "" });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalRegisterInput>({ resolver: zodResolver(professionalRegisterSchema) });

  async function onSubmit(data: ProfessionalRegisterInput) {
    const frontErr = !dniFront ? "Requerido" : "";
    const backErr = !dniBack ? "Requerido" : "";
    setDniErrors({ front: frontErr, back: backErr });
    if (frontErr || backErr) return;

    try {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("phone", data.phone);
      formData.append("dni", String(data.dni));
      formData.append("dniFront", dniFront!);
      formData.append("dniBack", dniBack!);

      const res = await fetch("/api/register/profesional", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();

      if (res.status === 409) {
        setError("email", { message: "Este email ya está registrado" });
        return;
      }

      if (res.status === 400 && body.issues) {
        const fields = body.issues.fieldErrors as Record<string, string[]>;
        for (const [field, msgs] of Object.entries(fields)) {
          if (field === "dniFront") setDniErrors((e) => ({ ...e, front: msgs[0] }));
          else if (field === "dniBack") setDniErrors((e) => ({ ...e, back: msgs[0] }));
          else setError(field as keyof ProfessionalRegisterInput, { message: msgs[0] });
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Teléfono"
          type="tel"
          placeholder="+54 11 1234-5678"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FormField
          label="DNI"
          type="number"
          placeholder="46800296"
          error={errors.dni?.message}
          {...register("dni")}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-brand-gray mb-3">
          Necesitamos una foto del frente y reverso de tu DNI para verificar tu identidad.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <DniUpload
            label="DNI — Frente"
            onChange={setDniFront}
            error={dniErrors.front}
          />
          <DniUpload
            label="DNI — Reverso"
            onChange={setDniBack}
            error={dniErrors.back}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-xl bg-brand-violet py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isSubmitting ? "Enviando solicitud..." : "Solicitar registro"}
      </button>
    </form>
  );
}
