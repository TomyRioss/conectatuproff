import Link from "next/link";
import ProfessionalRegisterForm from "@/components/auth/ProfessionalRegisterForm";
import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function ProfesionalRegisterPage() {
  return (
    <AuthShell
      imageSrc="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Profesional en su trabajo"
      gradientClass="bg-gradient-to-br from-brand-dark/80 via-brand-dark/50 to-brand-violet/60"
      headerAction={
        <>
          ¿Sos cliente?{" "}
          <Link href="/register" className="text-brand-violet font-medium hover:underline">
            Registrate acá
          </Link>
        </>
      }
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-dark font-display">Registrate como profesional</h1>
          <p className="text-brand-gray text-sm mt-1">Creá tu cuenta y empezá a recibir clientes al instante</p>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <GoogleSignInButton callbackUrl="/register/completar?next=/profesional/onboarding" />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-brand-gray">o completá el formulario</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        </div>

        <ProfessionalRegisterForm />

        <p className="mt-6 text-center text-sm text-brand-gray">
          ¿Ya tenés cuenta?{" "}
          <Link href="/profesional/login" className="text-brand-violet font-medium hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </AuthShell>
  );
}
