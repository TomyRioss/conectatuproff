"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function OwnerLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "BANNED") {
      toast.error("Esta cuenta fue suspendida.");
    } else if (error) {
      toast.error("Credenciales incorrectas.");
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
        toast.error("Credenciales incorrectas.");
        return;
      }

      const session = await getSession();
      const role = (session?.user as { role?: string })?.role;

      if (role !== "OWNER" && role !== "SUPER_ADMIN") {
        toast.error("No tenés permisos para acceder a este panel.");
        await signOut({ redirect: false });
        return;
      }

      router.push("/owner");
      router.refresh();
    } catch {
      toast.error("Ocurrió un error, intentá de nuevo.");
    }
  }

  return (
    <AuthShell
      imageSrc="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Panel de administración"
      gradientClass="bg-gradient-to-br from-brand-dark/90 via-brand-dark/70 to-brand-violet/60"
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-dark font-display">Panel del propietario</h1>
          <p className="text-brand-gray text-sm mt-1">Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            label="Email"
            type="email"
            placeholder="admin@conectatuproff.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label="Contraseña"
            placeholder="Contraseña"
            error={errors.password?.message}
            {...register("password")}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand-violet py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Verificando..." : "Ingresar al panel"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function OwnerLoginPage() {
  return (
    <Suspense>
      <OwnerLoginForm />
    </Suspense>
  );
}
