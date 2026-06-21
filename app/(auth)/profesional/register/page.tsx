import Link from "next/link";
import ProfessionalRegisterForm from "@/components/auth/ProfessionalRegisterForm";
import AuthShell from "@/components/auth/AuthShell";

export default function ProfesionalRegisterPage() {
  return (
    <AuthShell
      imageSrc="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1260&h=900&dpr=2"
      imageAlt="Profesional en su trabajo"
      gradientClass="bg-gradient-to-br from-brand-dark/80 via-brand-dark/50 to-brand-violet/60"
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-dark font-display">Registrate como profesional</h1>
          <p className="text-brand-gray text-sm mt-1">Tu cuenta será revisada antes de ser activada</p>
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
