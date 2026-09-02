import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function EducationPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = rawUsername.replace(/^@/, "");

  const pro = await prisma.professional.findFirst({
    where: { isActive: true, user: { username, isActive: true } },
    select: {
      firstName: true,
      lastName: true,
      educations: { orderBy: { year: "desc" } },
    },
  });

  if (!pro || pro.educations.length === 0) notFound();

  return (
    <main className="min-h-screen bg-brand-bg pb-16">
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <Link
          href={`/perfil/profesional/${username}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-gray hover:text-brand-dark transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Volver al perfil
        </Link>

        <h1 className="text-xl font-bold text-brand-dark mb-1">
          Educación de {pro.firstName} {pro.lastName}
        </h1>
        <p className="text-sm text-brand-gray mb-6">
          Formación académica cargada por el profesional
        </p>

        <div className="flex flex-col gap-3">
          {pro.educations.map((edu) => (
            <Card key={edu.id} className="bg-white border border-gray-200">
              <CardContent className="flex items-start gap-3 py-4">
                <div className="w-9 h-9 rounded-full bg-brand-violet/10 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-brand-violet" />
                </div>
                <div>
                  <p className="font-semibold text-brand-dark">{edu.degree}</p>
                  {edu.fieldOfStudy && (
                    <p className="text-sm text-brand-gray">{edu.fieldOfStudy}</p>
                  )}
                  <p className="text-sm text-brand-gray">
                    {edu.institution}
                    {edu.location ? ` · ${edu.location}` : ""}
                  </p>
                  <p className="text-xs text-brand-gray mt-1">
                    {edu.graduated ? "Graduado" : "En curso"}
                    {edu.year ? ` · ${edu.year}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
