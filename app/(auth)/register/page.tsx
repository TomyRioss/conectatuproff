"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import { clientRegisterSchema, type ClientRegisterInput } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegisterInput>({ resolver: zodResolver(clientRegisterSchema) });

  async function onSubmit(data: ClientRegisterInput) {
    try {
      const res = await fetch("/api/register/cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (res.status === 409) {
        setError("email", { message: "Este email ya está registrado" });
        return;
      }

      if (res.status === 400 && body.issues) {
        const fields = body.issues.fieldErrors as Record<string, string[]>;
        for (const [field, msgs] of Object.entries(fields)) {
          setError(field as keyof ClientRegisterInput, { message: msgs[0] });
        }
        return;
      }

      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
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
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-dark font-display">Crear cuenta</h1>
          <p className="text-brand-gray text-sm mt-1">Encontrá al profesional ideal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nombre" placeholder="Juan" error={errors.firstName?.message} {...register("firstName")} />
            <FormField label="Apellido" placeholder="García" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <FormField label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register("email")} />
          <PasswordInput label="Contraseña" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />
          <FormField label="Teléfono (opcional)" type="tel" placeholder="+54 11 1234-5678" error={errors.phone?.message} {...register("phone")} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-5 flex flex-col gap-2 text-center text-sm text-brand-gray">
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
