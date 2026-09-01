import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatRelativeTime } from "@/lib/utils"
import { redirect } from "next/navigation"
import { Mail, Phone, CreditCard, CheckCircle, Star, MapPin } from "lucide-react"
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
    month: "short",
  })

  const avgMine =
    misResenas.length > 0
      ? (misResenas.reduce((s, r) => s + r.rating, 0) / misResenas.length).toFixed(1)
      : null

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg overflow-x-hidden">
      <div className="px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-4 lg:gap-6 items-start">

        {/* ── Columna identidad (sticky en desktop) ── */}
        <aside className="lg:sticky lg:top-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col items-center text-center gap-3 px-6 pt-8 pb-6 border-b border-gray-100">
            <div className="w-32 h-32 rounded-full bg-brand-violet text-white text-4xl font-bold flex items-center justify-center shadow-md shadow-brand-violet/20 select-none overflow-hidden ring-4 ring-white">
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
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <h1 className="text-xl font-bold text-brand-dark leading-tight">
                {cliente.firstName} {cliente.lastName}
              </h1>
              <EditProfileModal
                firstName={cliente.firstName}
                lastName={cliente.lastName}
                avatarKey={avatarKey}
                initials={initials}
              />
            </div>
            {cliente.user.username && (
              <p className="text-sm text-brand-gray -mt-1">@{cliente.user.username}</p>
            )}
            {cliente.isVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                <CheckCircle size={12} />Cuenta verificada
              </span>
            )}
          </div>

          {/* stats compactas */}
          <dl className="grid grid-cols-2 border-b border-gray-100 [&>div]:border-t [&>div]:border-gray-100 [&>div:nth-child(odd)]:border-r">
            <Stat label="Turnos" value={String(cliente._count.appointments)} />
            <Stat label="Reseñas" value={String(cliente._count.reviews)} />
            <Stat label="Miembro desde" value={miembroDesde} className="col-span-2" />
          </dl>

          <div className="px-6 pt-4 pb-1">
            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">Información personal</p>
          </div>
          <div className="divide-y divide-gray-100">
            <DataRow icon={<Mail size={16} />} label="Email" value={cliente.user.email} />
            <EditableDataRow icon={<Phone size={16} />} label="Teléfono" value={cliente.phone ?? null} field="phone" addLabel="+ Añadir Teléfono" inputType="tel" />
            <EditableDataRow icon={<MapPin size={16} />} label="Lugar" value={cliente.location ?? null} field="location" addLabel="+ Añadir Lugar" />
            <EditableDataRow icon={<CreditCard size={16} />} label="DNI" value={cliente.dni ? String(cliente.dni) : null} field="dni" addLabel="+ Añadir DNI" inputType="number" />
          </div>
        </aside>

        {/* ── Columna contenido ── */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">Historial de reseñas</p>
            {avgMine && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark">
                <Star size={14} className="fill-brand-green text-brand-green" />
                {avgMine}
                <span className="font-normal text-brand-gray">· {misResenas.length}</span>
              </span>
            )}
          </div>

          {misResenas.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-brand-gray">Aún no dejaste reseñas.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-gray-100">
              {misResenas.map((r) => {
                const profInitials = `${r.professional.firstName[0]}${r.professional.lastName[0]}`.toUpperCase()
                return (
                  <article key={r.id} className="bg-white px-6 py-5 flex flex-col gap-2 transition-colors hover:bg-brand-bg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-violet text-white text-xs font-bold flex items-center justify-center shadow select-none overflow-hidden flex-shrink-0">
                          {r.professional.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/avatar?key=${encodeURIComponent(r.professional.avatarUrl)}`}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            profInitials
                          )}
                        </div>
                        <p className="text-sm font-semibold text-brand-dark truncate">
                          {r.professional.firstName} {r.professional.lastName}
                        </p>
                      </div>
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
                      <p className="text-sm text-brand-gray leading-relaxed">{r.comment}</p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3.5">
      <span className="text-brand-gray flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-gray">{label}</p>
        <p className="text-sm font-medium truncate text-brand-dark">{value}</p>
      </div>
    </div>
  )
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 px-6 py-3 min-w-0 ${className}`}>
      <dd className="text-sm font-bold text-brand-dark leading-tight break-words">{value}</dd>
      <dt className="text-xs text-brand-gray">{label}</dt>
    </div>
  )
}
