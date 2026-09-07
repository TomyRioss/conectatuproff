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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {educationCount > 0 && (
          <Link href={`/perfil/profesional/${username}/education`}>
            <Card className="bg-white border border-gray-200 hover:border-brand-violet/40 hover:shadow-sm transition-all">
              <CardContent className="flex items-center gap-3 py-5">
                <span className="h-11 w-11 rounded-full bg-brand-violet/10 flex items-center justify-center shrink-0">
                  <GraduationCap size={22} className="text-brand-violet" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-brand-dark">Educación</p>
                  <p className="text-sm text-brand-gray">{educationCount} cargada{educationCount > 1 ? "s" : ""}</p>
                </div>
                <ChevronRight size={18} className="text-brand-gray shrink-0" />
              </CardContent>
            </Card>
          </Link>
        )}
        {certificationCount > 0 && (
          <Link href={`/perfil/profesional/${username}/certifications`}>
            <Card className="bg-white border border-gray-200 hover:border-brand-green/40 hover:shadow-sm transition-all">
              <CardContent className="flex items-center gap-3 py-5">
                <span className="h-11 w-11 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                  <BadgeCheck size={22} className="text-brand-green" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-brand-dark">Certificaciones</p>
                  <p className="text-sm text-brand-gray">{certificationCount} cargada{certificationCount > 1 ? "s" : ""}</p>
                </div>
                <ChevronRight size={18} className="text-brand-gray shrink-0" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </section>
  );
}
