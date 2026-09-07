"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, Ban, Clock } from "lucide-react";
import FormField from "@/components/auth/FormField";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

function ProfesionalLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [notProfessional, setNotProfessional] = useState(false);
  const [accountStatus, setAccountStatus] = useState<null | "review" | "disabled">(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "PENDING_REVIEW") {
      setAccountStatus("review");
    } else if (error === "BANNED") {
      setAccountStatus("disabled");
    } else if (error === "NOT_PROFESSIONAL") {
      const t = setTimeout(() => setNotProfessional(true), 0);
      return () => clearTimeout(t);
    } else if (error) {
      toast.error("Email o contraseña incorrectos.");
    }
  }, [searchParams]);

  async function onSubmit(data: LoginInput) {
    setNotProfessional(false);
    setAccountStatus(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        professionalOnly: "true",
        redirect: false,
      });

      if (result?.error) {
        if (result.code === "NOT_PROFESSIONAL") {
          setNotProfessional(true);
        } else if (result.code === "PENDING_REVIEW") {
          setAccountStatus("review");
        } else if (result.code === "BANNED") {
          setAccountStatus("disabled");
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
      imageSrc="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Profesional en su trabajo"
      gradientClass="bg-gradient-to-br from-brand-dark/80 via-brand-dark/50 to-brand-violet/60"
      headerAction={
        <>
          ¿Sos cliente?{" "}
          <Link href="/login" className="text-brand-violet font-medium hover:underline">
            Ingresá acá
          </Link>
        </>
      }
    >
      <div>
        <div className="mb-6 lg:mb-8">
          <h1 className="text-[22px] leading-tight sm:text-2xl font-bold text-brand-dark font-display">Acceso profesionales</h1>
          <p className="text-brand-gray text-sm mt-1">Ingresá a tu panel profesional</p>
        </div>

        {accountStatus === "review" && (
          <div className="mb-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <Clock className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <div className="text-sm text-amber-800 leading-snug">
              <p className="font-semibold">Tu cuenta profesional está siendo revisada</p>
              <p className="mt-1">
                Tu cuenta Profesional está siendo revisada por el equipo de ConectaTuProff, tendrás
                novedades en breves. Te avisaremos por email apenas se resuelva. Si creés que es un
                error, escribinos a soporte.
              </p>
            </div>
          </div>
        )}

        {accountStatus === "disabled" && (
          <div className="mb-4 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <Ban className="mt-0.5 shrink-0 text-red-500" size={18} />
            <div className="text-sm text-red-800 leading-snug">
              <p className="font-semibold">Cuenta deshabilitada</p>
              <p className="mt-1">
                Tu cuenta de profesional fue deshabilitada por el equipo de ConectaTuProff. Ya no
                podés acceder al panel profesional. Si querés más información o apelar la decisión,
                contactá a soporte.
              </p>
            </div>
          </div>
        )}

        {notProfessional && (
          <div className="mb-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <p className="text-sm text-amber-800 leading-snug">
              <span className="font-semibold">Cuenta de Cliente.</span> Creá una cuenta de Profesional o{" "}
              <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                accedé desde acá como cliente
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <GoogleSignInButton callbackUrl="/profesional/onboarding" />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-brand-gray whitespace-nowrap">o con tu email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-4">
          <FormField label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register("email")} />
          <PasswordInput label="Contraseña" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand-violet py-3.5 lg:py-3 min-h-[48px] text-[15px] lg:text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 active:scale-[0.99]"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-5 pb-2 text-center text-sm text-brand-gray">
          <p>
            ¿No tenés cuenta?{" "}
            <Link href="/profesional/register" className="text-brand-violet font-medium hover:underline">Registrate como profesional</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ProfesionalLoginPage() {
  return (
    <Suspense>
      <ProfesionalLoginForm />
    </Suspense>
  );
}
