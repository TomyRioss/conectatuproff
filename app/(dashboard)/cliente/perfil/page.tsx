import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Mail, Phone, CreditCard, CheckCircle, Star, CalendarDays } from "lucide-react"
import EditProfileModal from "@/components/cliente/EditProfileModal"

export default async function ClientePerfilPage() {
  const session = await auth()

  if (!session?.user?.id || (session.user as { role?: string }).role !== "CLIENT") {
    redirect("/login")
  }

  const cliente = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { email: true, username: true } },
      _count: { select: { appointments: true, reviews: true } },
    },
  })

  if (!cliente) redirect("/login")

  const initials = `${cliente.firstName[0]}${cliente.lastName[0]}`.toUpperCase()
  const avatarKey = cliente.avatarUrl ?? null

  const miembroDesde = new Date(cliente.createdAt).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-brand-bg overflow-x-hidden">

      {/* ── Banner + Avatar wrapper ── */}
      <div className="relative flex-shrink-0">
        <div className="h-52 bg-brand-dark overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, #6C5CE7 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #1EC97E 0%, transparent 70%)" }}
          />
        </div>

        <div className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2">
          <div className="w-28 h-28 rounded-full bg-brand-violet text-white text-3xl font-bold flex items-center justify-center ring-4 ring-white shadow-xl select-none overflow-hidden">
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
        </div>
      </div>

      {/* ── Identidad ── */}
      <div className="pt-20 pb-4 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-dark leading-tight">
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
          <p className="text-sm text-brand-gray">@{cliente.user.username}</p>
        )}
        {cliente.isVerified && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 mt-1">
            <CheckCircle size={12} />Cuenta verificada
          </span>
        )}
      </div>

      {/* ── Contenido principal ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 pb-10 px-4 md:px-6">

        <div className="md:col-span-2 flex flex-col gap-5">
          <Section title="Información personal">
            <DataRow icon={<Mail size={16} />} label="Email" value={cliente.user.email} />
            <DataRow icon={<Phone size={16} />} label="Teléfono" value={cliente.phone ?? "—"} />
            <DataRow icon={<CreditCard size={16} />} label="DNI" value={cliente.dni ? String(cliente.dni) : "—"} />
            <DataRow icon={<CalendarDays size={16} />} label="Miembro desde" value={miembroDesde} />
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
