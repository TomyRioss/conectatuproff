import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CancelAppointmentButton } from "@/components/profesionales/CancelAppointmentButton";
import { LeaveReviewButton } from "@/components/cliente/LeaveReviewButton";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-brand-green/10 text-brand-green",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-brand-violet/10 text-brand-violet",
  NO_SHOW: "bg-gray-100 text-brand-gray",
};

export default async function ClienteTurnosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const client = await prisma.client.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!client) redirect("/");

  const appointments = await prisma.appointment.findMany({
    where: { clientId: client.id },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      startAt: true,
      status: true,
      priceAtBooking: true,
      currency: true,
      service: { select: { title: true } },
      professional: { select: { id: true, firstName: true, lastName: true, user: { select: { username: true } } } },
    },
  });

  const reviewedProfessionalIds = new Set(
    (await prisma.review.findMany({ where: { clientId: client.id }, select: { professionalId: true } })).map(
      (r) => r.professionalId
    )
  );

  return (
    <main className="min-h-screen bg-brand-bg pb-28">
      <div className="max-w-3xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-bold text-brand-dark">Mis turnos</h1>
        <p className="text-brand-gray mt-2">Historial completo de tus reservas.</p>

        {appointments.length === 0 ? (
          <p className="text-brand-gray mt-8">Todavía no reservaste ningún turno.</p>
        ) : (
          <div className="mt-8 space-y-3">
            {appointments.map((a) => {
              const username = a.professional.user.username;
              const info = (
                <div className="min-w-0">
                  <p className="font-semibold text-brand-dark truncate">
                    {a.service?.title ?? "Turno"} —{" "}
                    <span className={username ? "underline decoration-brand-violet decoration-2 underline-offset-2" : ""}>
                      {a.professional.firstName} {a.professional.lastName}
                    </span>
                  </p>
                  <p className="text-sm text-brand-gray mt-0.5">
                    {new Date(a.startAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {a.priceAtBooking != null && (
                    <p className="text-sm text-brand-violet font-medium mt-0.5">
                      ${Number(a.priceAtBooking).toLocaleString("es-AR")} {a.currency}
                    </p>
                  )}
                </div>
              );
              return (
                <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  {username ? (
                    <Link href={`/perfil/profesional/${username}`} className="min-w-0 hover:opacity-80">
                      {info}
                    </Link>
                  ) : (
                    info
                  )}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                      <CancelAppointmentButton id={a.id} startAt={a.startAt.toISOString()} />
                    )}
                    {a.status === "COMPLETED" && !reviewedProfessionalIds.has(a.professional.id) && (
                      <LeaveReviewButton
                        professionalId={a.professional.id}
                        professionalName={`${a.professional.firstName} ${a.professional.lastName}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
