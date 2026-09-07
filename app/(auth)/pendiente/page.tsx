import { Clock } from "lucide-react";
import Link from "next/link";

export default function PendientePage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0 py-8 sm:py-0 text-center bg-white min-h-screen sm:min-h-0 sm:bg-transparent flex flex-col justify-center sm:block">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm">
        <div className="flex justify-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-bg flex items-center justify-center">
            <Clock size={28} className="text-brand-violet sm:hidden" />
            <Clock size={32} className="text-brand-violet hidden sm:block" />
          </div>
        </div>

        <h1 className="text-[22px] leading-tight sm:text-2xl font-bold text-brand-dark font-display mb-3">
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
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-green px-6 py-3.5 sm:py-3 min-h-[48px] sm:min-h-0 text-[15px] sm:text-sm font-semibold text-white hover:opacity-90 active:scale-[0.99] transition sm:inline-block sm:w-auto"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
