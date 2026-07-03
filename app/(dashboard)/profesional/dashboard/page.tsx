import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfesionalDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const pro = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      bio: true,
      specialty: true,
      location: true,
      rating: true,
      isVerified: true,
      isActive: true,
      subcategory: { select: { name: true } },
    },
  });

  if (!pro) redirect("/profesional/onboarding");

  if (!pro.isVerified) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-4xl mx-auto">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-brand-dark">Verificación pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-gray">
              Tu perfil profesional está en revisión. Te avisaremos por email cuando esté verificado.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        Hola, {pro.firstName} {pro.lastName}
      </h1>

      <div className="flex gap-2 mb-8">
        <Badge
          className={
            pro.isVerified
              ? "bg-brand-green text-white"
              : "bg-brand-gray text-white"
          }
        >
          {pro.isVerified ? "Verificado" : "Pendiente verificación"}
        </Badge>
        <Badge
          className={
            pro.isActive
              ? "bg-brand-violet text-white"
              : "bg-gray-300 text-brand-dark"
          }
        >
          {pro.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pro.subcategory && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gray">Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-dark font-medium">{pro.subcategory.name}</p>
            </CardContent>
          </Card>
        )}

        {pro.specialty && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gray">Especialidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-dark font-medium">{pro.specialty}</p>
            </CardContent>
          </Card>
        )}

        {pro.location && (
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm text-brand-gray">Ubicación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-dark font-medium">{pro.location}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-brand-gray">Calificación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-dark font-medium">
              {pro.rating > 0 ? `${pro.rating.toFixed(1)} ⭐` : "Sin calificaciones aún"}
            </p>
          </CardContent>
        </Card>
      </div>

      {pro.bio && (
        <Card className="bg-white border border-gray-200 mt-4">
          <CardHeader>
            <CardTitle className="text-sm text-brand-gray">Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-dark">{pro.bio}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
