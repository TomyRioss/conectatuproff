import { Clock } from "lucide-react";
import Link from "next/link";

export default function PendientePage() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center">
            <Clock size={32} className="text-brand-violet" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-brand-dark font-display mb-3">
          Tu registro está en revisión
        </h1>

        <p className="text-brand-gray text-sm leading-relaxed mb-2">
          Recibimos tu solicitud y las fotos de tu DNI.
        </p>
        <p className="text-brand-gray text-sm leading-relaxed">
          Revisaremos tu información y te notificaremos por email en{" "}
          <span className="font-medium text-brand-dark">24–48 horas</span>.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
