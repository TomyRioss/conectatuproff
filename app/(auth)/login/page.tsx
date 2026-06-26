"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || error === "undefined") return;
    if (error === "PENDING_REVIEW") {
      toast.error("Tu cuenta está en revisión. Te avisaremos por email cuando sea aprobada.");
    } else if (error === "BANNED") {
      toast.error("Tu cuenta fue suspendida. Contactá a soporte.");
    } else if (error) {
      toast.error("Email o contraseña incorrectos.");
    }
  }, [searchParams]);

  async function onSubmit(data: LoginInput) {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "PENDING_REVIEW") {
          toast.error("Tu cuenta está en revisión. Te avisaremos por email cuando sea aprobada.");
        } else if (result.error === "BANNED") {
          toast.error("Tu cuenta fue suspendida. Contactá a soporte.");
        } else {
          toast.error("Email o contraseña incorrectos.");
        }
        return;
      }

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
          <h1 className="text-2xl font-bold text-brand-dark font-display">Bienvenido de vuelta</h1>
          <p className="text-brand-gray text-sm mt-1">Ingresá a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand-green py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-5 flex flex-col gap-2 text-center text-sm text-brand-gray">
          <p>
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-brand-violet font-medium hover:underline">
              Registrate
            </Link>
          </p>
          <p>
            ¿Sos profesional?{" "}
            <Link href="/profesional/login" className="text-brand-violet font-medium hover:underline">
              Ingresá acá
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
