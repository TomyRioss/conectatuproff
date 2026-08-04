import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatRelativeTime } from "@/lib/utils"
import { redirect } from "next/navigation"
import { Mail, Phone, CreditCard, CheckCircle, Star, CalendarDays, MapPin } from "lucide-react"
import EditProfileModal from "@/components/cliente/EditProfileModal"
import EditableDataRow from "@/components/cliente/EditableDataRow"

export default async function ClientePerfilPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username: rawUsername } = await params
  const username = rawUsername.replace(/^@/, "")
  const session = await auth()

  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login")
  }

  const cliente = await prisma.client.findFirst({
    where: { user: { username } },
    include: {
      user: { select: { email: true, username: true, lastActivity: true } },
      _count: { select: { appointments: true, reviews: true } },
    },
  })

  if (!cliente || cliente.userId !== session.user.id) redirect("/login")

  const misResenas = await prisma.review.findMany({
    where: { clientId: cliente.id },
    include: {
      professional: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const initials = `${cliente.firstName[0]}${cliente.lastName[0]}`.toUpperCase()
  const avatarKey = cliente.avatarUrl ?? null

  const miembroDesde = new Date(cliente.createdAt).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  })

  const ultimoLogin = formatRelativeTime(cliente.user.lastActivity)

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-brand-bg overflow-x-hidden">

      {/* ── Header card ── */}
      <div className="px-4 md:px-6 pt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row gap-5 md:items-center">
          <div className="w-20 h-20 rounded-full bg-brand-violet text-white text-2xl font-bold flex items-center justify-center shadow select-none overflow-hidden flex-shrink-0">
            {avatarKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/avatar?key=${encodeURIComponent(avatarKey)}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-brand-dark leading-tight">
                {cliente.firstName} {cliente.lastName}
              </h1>
              <EditProfileModal
                firstName={cliente.firstName}
                lastName={cliente.lastName}
                avatarKey={avatarKey}
                initials={initials}
              />
              {cliente.isVerified && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                  <CheckCircle size={12} />Cuenta verificada
                </span>
              )}
            </div>
            {cliente.user.username && (
              <p className="text-sm text-brand-gray mt-0.5">@{cliente.user.username}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:border-l md:border-gray-100 md:pl-6">
            <HeaderStat label="Turnos" value={String(cliente._count.appointments)} />
            <HeaderStat label="Reseñas" value={String(cliente._count.reviews)} />
            <HeaderStat label="Último login" value={ultimoLogin} />
            <HeaderStat label="Miembro desde" value={miembroDesde} />
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 pb-10 px-4 md:px-6 pt-5">

        <div className="md:col-span-2 flex flex-col gap-5">
          <Section title="Información personal">
            <DataRow icon={<Mail size={16} />} label="Email" value={cliente.user.email} />
            <EditableDataRow icon={<Phone size={16} />} label="Teléfono" value={cliente.phone ?? null} field="phone" addLabel="+ Añadir Teléfono" inputType="tel" />
            <EditableDataRow icon={<MapPin size={16} />} label="Lugar" value={cliente.location ?? null} field="location" addLabel="+ Añadir Lugar" />
            <EditableDataRow icon={<CreditCard size={16} />} label="DNI" value={cliente.dni ? String(cliente.dni) : null} field="dni" addLabel="+ Añadir DNI" inputType="number" />
          </Section>

          <Section title="Historial de reseñas">
            {misResenas.length === 0 ? (
              <p className="px-5 py-6 text-sm text-brand-gray">Aún no dejaste reseñas.</p>
            ) : (
              misResenas.map((r) => (
                <div key={r.id} className="px-5 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-dark">
                      {r.professional.firstName} {r.professional.lastName}
                    </p>
                    <span className="text-xs text-brand-gray flex-shrink-0">
                      {formatRelativeTime(r.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < r.rating ? "fill-brand-green text-brand-green" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-brand-gray">{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Tu actividad">
            <div className="grid grid-cols-2 gap-3 p-4">
              <StatCard
                icon={<CalendarDays size={18} className="text-brand-violet" />}
                value={String(cliente._count.appointments)}
                label="Turnos"
              />
              <StatCard
                icon={<Star size={18} className="text-brand-green" />}
                value={String(cliente._count.reviews)}
                label="Reseñas"
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border-y border-gray-200 h-full">
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-brand-gray flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-gray">{label}</p>
        <p className="text-sm font-medium truncate text-brand-dark">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1 items-start">
      {icon}
      <p className="text-2xl font-bold text-brand-dark leading-none mt-1">{value}</p>
      <p className="text-xs text-brand-gray">{label}</p>
    </div>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="text-sm font-semibold text-brand-dark truncate">{value}</p>
    </div>
  )
}
