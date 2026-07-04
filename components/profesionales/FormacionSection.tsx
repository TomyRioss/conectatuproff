import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BadgeCheck, ChevronRight } from "lucide-react";

export function FormacionSection({
  username,
  educationCount,
  certificationCount,
}: {
  username: string;
  educationCount: number;
  certificationCount: number;
}) {
  if (educationCount === 0 && certificationCount === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide uppercase text-brand-gray mb-2">
        Formación y certificaciones
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {educationCount > 0 && (
          <Link href={`/perfil/profesional/${username}/education`}>
            <Card className="bg-white border border-gray-200 hover:border-brand-violet/40 transition-colors">
              <CardContent className="flex items-center gap-3 py-4">
                <GraduationCap size={20} className="text-brand-violet shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-dark">Educación</p>
                  <p className="text-xs text-brand-gray">{educationCount} cargada{educationCount > 1 ? "s" : ""}</p>
                </div>
                <ChevronRight size={16} className="text-brand-gray" />
              </CardContent>
            </Card>
          </Link>
        )}
        {certificationCount > 0 && (
          <Link href={`/perfil/profesional/${username}/certifications`}>
            <Card className="bg-white border border-gray-200 hover:border-brand-green/40 transition-colors">
              <CardContent className="flex items-center gap-3 py-4">
                <BadgeCheck size={20} className="text-brand-green shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-dark">Certificaciones</p>
                  <p className="text-xs text-brand-gray">{certificationCount} cargada{certificationCount > 1 ? "s" : ""}</p>
                </div>
                <ChevronRight size={16} className="text-brand-gray" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </section>
  );
}
