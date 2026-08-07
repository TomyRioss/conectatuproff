import { Check } from "lucide-react";

interface AuthBenefitsProps {
  variant?: "cliente" | "profesional";
}

const BENEFITS = {
  cliente: [
    "Encontrá profesionales verificados en minutos",
    "Contacto directo por WhatsApp",
    "Agendá turnos sin complicaciones",
    "Reseñas reales de clientes",
    "Soporte personalizado 24/7",
  ],
  profesional: [
    "Llegá a miles de clientes en tu zona",
    "Recibí solicitudes directo por WhatsApp",
    "Gestión simple de turnos y agenda",
    "Recibí reseñas y construí reputación",
    "Soporte personalizado 24/7",
  ],
};

export default function AuthBenefits({ variant = "cliente" }: AuthBenefitsProps) {
  const items = BENEFITS[variant];

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm font-medium text-white">
          <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-green text-white shrink-0">
            <Check size={12} strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
