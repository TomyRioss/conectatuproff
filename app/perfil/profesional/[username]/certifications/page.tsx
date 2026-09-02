import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function CertificationsPage({
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
      certifications: { orderBy: { year: "desc" } },
    },
  });

  if (!pro || pro.certifications.length === 0) notFound();

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
          Certificaciones de {pro.firstName} {pro.lastName}
        </h1>
        <p className="text-sm text-brand-gray mb-6">
          Certificados cargados por el profesional
        </p>

        <div className="flex flex-col gap-3">
          {pro.certifications.map((cert) => (
            <Card key={cert.id} className="bg-white border border-gray-200">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
                  <BadgeCheck size={18} className="text-brand-green" />
                </div>
                <div>
                  <p className="font-semibold text-brand-dark">{cert.name.split(" · ")[0]}</p>
                  <p className="text-sm text-brand-gray">
                    {[cert.name.split(" · ")[1], cert.year].filter(Boolean).join(" · ")}
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
