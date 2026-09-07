"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import { completeProfileFormSchema, type CompleteProfileFormInput } from "@/lib/validations/auth";

// Solo rutas internas: evita open-redirect vía ?next=
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function CompletarPerfilForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { data: session, status, update } = useSession();
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormInput>({ resolver: zodResolver(completeProfileFormSchema) });

  const username = watch("username") ?? "";

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && session?.user?.needsSetup === false) router.replace(next);
  }, [status, session, router, next]);

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

  async function onSubmit(data: CompleteProfileFormInput) {
    try {
      const res = await fetch("/api/register/completar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });
      const body = await res.json();

      if (res.status === 409) {
        setError("username", { message: "Este nombre de usuario ya está en uso" });
        return;
      }
      if (res.status === 400 && body.issues) {
        const fields = body.issues.fieldErrors as Record<string, string[]>;
        for (const [field, msgs] of Object.entries(fields)) {
          setError(field as keyof CompleteProfileFormInput, { message: msgs[0] });
        }
        return;
      }
      if (!res.ok) {
        toast.error("Ocurrió un error, intentá de nuevo.");
        return;
      }

      await update({});
      router.push(next);
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
      <div className="flex flex-col gap-5 sm:gap-6">
        <div>
          <h1 className="text-[22px] leading-tight sm:text-2xl font-bold text-brand-dark font-display">Completá tu cuenta</h1>
          <p className="text-brand-gray text-sm mt-1">
            Elegí un nombre de usuario y una contraseña para terminar de crear tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-1">
            <FormField label="Nombre de usuario" placeholder="juan_garcia" error={errors.username?.message} {...register("username")} />
            {usernameStatus === "checking" && <p className="text-xs text-brand-gray">Verificando...</p>}
            {usernameStatus === "available" && <p className="text-xs text-brand-green font-medium">✓ Usuario disponible</p>}
            {usernameStatus === "taken" && <p className="text-xs text-red-500 font-medium">✗ Usuario no disponible</p>}
          </div>

          <PasswordInput label="Contraseña" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />
          <PasswordInput label="Confirmar contraseña" placeholder="Repetí tu contraseña" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand-green py-3.5 lg:py-3 min-h-[48px] text-[15px] lg:text-sm font-semibold text-white hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Terminar"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense>
      <CompletarPerfilForm />
    </Suspense>
  );
}
