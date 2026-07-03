import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

// Placeholder ilustrativo: no hay modelo de formación/certificaciones en el schema todavía.
const ITEMS = [
  "Formación profesional",
  "Certificaciones",
  "Especializaciones",
];

export function FormacionSection() {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
        Formación y certificaciones
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {ITEMS.map((label) => (
          <Card key={label} className="bg-white border border-gray-200">
            <CardContent className="flex flex-col items-center text-center gap-2 py-4 px-2">
              <GraduationCap size={20} className="text-brand-violet" />
              <span className="text-xs text-brand-gray">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
