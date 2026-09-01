"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import { nf, fmtCurrency } from "@/lib/owner/format";

interface DashboardData {
  clients: number;
  professionals: number;
  services: number;
  activeServices: number;
  conversations: number;
  activeConversations: number;
  categories: number;
  reviews: number;
  pendingPetitions: number;
  pendingDocs: number;
  appointmentsTotal: number;
  appointmentsByStatus: {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
  paidProfessionals: number;
  mrr: number;
  planPrice: number;
  avgServicePrice: number | null;
}

const APPT_SEGMENTS = [
  { key: "COMPLETED", label: "Completados", fill: "bg-brand-green", dot: "bg-brand-green" },
  { key: "CONFIRMED", label: "Confirmados", fill: "bg-brand-violet", dot: "bg-brand-violet" },
  { key: "PENDING", label: "Pendientes", fill: "bg-status-pending", dot: "bg-status-pending" },
  { key: "CANCELLED", label: "Cancelados", fill: "bg-brand-gray", dot: "bg-brand-gray" },
  { key: "NO_SHOW", label: "No-show", fill: "bg-status-noshow", dot: "bg-status-noshow" },
] as const;

function Figure({
  value,
  label,
  meta,
  accent,
  href,
  compact,
}: {
  value: string;
  label: string;
  meta?: string;
  accent?: boolean;
  href?: string;
  /** Use a smaller number size for wide strings (currency) that would otherwise
   * overflow a narrow grid column — panel width depends on the outer layout,
   * not the viewport, so this can't be solved with a `sm:`/`lg:` breakpoint. */
  compact?: boolean;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1 text-sm font-medium text-brand-gray">
        {label}
        {href ? (
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </p>
      <p
        className={`mt-1 font-display font-semibold tabular-nums tracking-tight ${
          compact ? "text-3xl" : "text-5xl"
        } ${accent ? "text-brand-violet" : "text-brand-dark"}`}
      >
        {value}
      </p>
      {meta ? <p className="mt-1 text-sm text-brand-gray">{meta}</p> : null}
    </>
  );

  if (!href) return <div>{body}</div>;

  return (
    <Link
      href={href}
      className="group -m-2 block rounded-lg p-2 transition-colors hover:bg-brand-bg"
    >
      {body}
    </Link>
  );
}

function StatRow({
  label,
  value,
  meta,
  href,
}: {
  label: string;
  value: string;
  meta?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate text-sm font-medium text-brand-dark">
          {label}
          {href ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-gray opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
        </p>
        {meta ? <p className="mt-0.5 text-xs text-brand-gray">{meta}</p> : null}
      </div>
      <p className="shrink-0 font-display text-2xl font-semibold tabular-nums text-brand-dark">
        {value}
      </p>
    </>
  );

  if (!href) {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-gray-200 py-3.5 last:border-b-0">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group -mx-3 flex items-baseline justify-between gap-4 rounded-lg border-b border-gray-200 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-brand-bg"
    >
      {content}
    </Link>
  );
}

function Panel({
  title,
  children,
  delay,
  mounted,
  href,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  mounted: boolean;
  href?: string;
}) {
  const heading = (
    <h2 className="mb-5 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gray">
      {href ? (
        <Link href={href} className="group flex items-center gap-1 hover:text-brand-dark">
          {title}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ) : (
        title
      )}
    </h2>
  );

  return (
    <section
      style={{ transitionDelay: `${delay}ms` }}
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(26,26,46,0.04),0_8px_24px_-12px_rgba(26,26,46,0.12)] transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      {heading}
      {children}
    </section>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200/70 ${className}`} />;
}

function PendingRow({
  count,
  singular,
  plural,
  href,
  cta,
}: {
  count: number;
  singular: string;
  plural: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-status-pending-soft px-4 py-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl font-semibold tabular-nums text-status-pending">
          {nf.format(count)}
        </span>
        <span className="text-sm text-brand-dark">{count === 1 ? singular : plural}</span>
      </div>
      <Button asChild size="sm" className="bg-brand-green text-brand-dark hover:bg-brand-green/90">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/owner/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        requestAnimationFrame(() => setMounted(true));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const ratio =
    data && data.professionals > 0
      ? (data.clients / data.professionals).toLocaleString("es-AR", {
          maximumFractionDigits: 1,
        })
      : "—";

  return (
    <div className="mx-auto max-w-6xl selection:bg-brand-violet/20 selection:text-brand-dark">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand-dark">
            Inicio
          </h1>
          <p className="mt-1 text-sm text-brand-gray">Estado general de la plataforma</p>
        </div>
      </div>

      {loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonBlock className="h-44 lg:col-span-2" />
          <SkeletonBlock className="h-52" />
          <SkeletonBlock className="h-52" />
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar el panel: {error}
        </div>
      )}

      {data && !loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Comunidad */}
          <Panel title="Comunidad" delay={0} mounted={mounted}>
            <div className="grid grid-cols-2 gap-6">
              <Figure
                value={nf.format(data.clients)}
                label="Clientes"
                meta="registrados"
                href="/owner/dashboard/clientes"
              />
              <Figure
                value={nf.format(data.professionals)}
                label="Profesionales"
                meta="en la plataforma"
                href="/owner/dashboard/profesionales"
              />
            </div>
            <div className="mt-5 border-t border-gray-200 pt-5">
              <Figure
                value={ratio}
                label="Clientes por profesional"
                meta="Promedio: clientes registrados ÷ profesionales en la plataforma"
                accent
              />
            </div>
          </Panel>

          {/* Ingresos */}
          <Panel title="Ingresos" delay={70} mounted={mounted} href="/owner/dashboard/ingresos">
            <div className="grid grid-cols-2 gap-6">
              <Figure
                value={fmtCurrency(data.mrr)}
                label="MRR (Pro+)"
                meta={data.planPrice > 0 ? `Plan ${fmtCurrency(data.planPrice)}/mes` : "Plan gratuito"}
                accent
                compact
              />
              <Figure value={nf.format(data.paidProfessionals)} label="Usuarios pagos" />
            </div>
            <div className="mt-5 border-t border-gray-200 pt-5">
              <Figure
                value={data.avgServicePrice ? fmtCurrency(data.avgServicePrice) : "—"}
                label="Costo prom. servicio"
              />
            </div>
          </Panel>

          {/* Agenda */}
          <Panel title="Agenda" delay={140} mounted={mounted} href="/owner/dashboard/agenda">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular-nums text-brand-dark">
                {nf.format(data.appointmentsTotal)}
              </span>
              <span className="text-sm text-brand-gray">turnos en total</span>
            </div>

            {data.appointmentsTotal > 0 ? (
              <>
                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                  {APPT_SEGMENTS.map((s) => {
                    const v = data.appointmentsByStatus[s.key];
                    if (!v) return null;
                    return (
                      <div
                        key={s.key}
                        className={s.fill}
                        style={{ width: `${(v / data.appointmentsTotal) * 100}%` }}
                      />
                    );
                  })}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {APPT_SEGMENTS.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                      <span className="text-brand-gray">{s.label}</span>
                      <span className="ml-auto font-medium tabular-nums text-brand-dark">
                        {nf.format(data.appointmentsByStatus[s.key])}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-brand-gray">Todavía no se agendaron turnos.</p>
            )}
          </Panel>

          {/* Catálogo */}
          <Panel title="Catálogo" delay={210} mounted={mounted}>
            <div className="grid gap-x-8 sm:grid-cols-2">
              <StatRow
                label="Servicios creados"
                value={nf.format(data.services)}
                meta={`${nf.format(data.activeServices)} activos`}
                href="/owner/dashboard/catalogo"
              />
              <StatRow
                label="Categorías"
                value={nf.format(data.categories)}
                href="/owner/dashboard/catalogo"
              />
              <StatRow label="Reseñas publicadas" value={nf.format(data.reviews)} />
              <StatRow
                label="Conversaciones activas"
                value={nf.format(data.activeConversations)}
                meta={`${nf.format(data.conversations)} en total · últimos 7 días`}
                href="/owner/dashboard/conversaciones"
              />
            </div>
          </Panel>

          {/* Pendientes */}
          <Panel title="Pendientes" delay={280} mounted={mounted}>
            {data.pendingPetitions > 0 || data.pendingDocs > 0 ? (
              <div className="space-y-3">
                {data.pendingPetitions > 0 && (
                  <PendingRow
                    count={data.pendingPetitions}
                    singular="petición espera revisión"
                    plural="peticiones esperan revisión"
                    href="/owner/peticiones"
                    cta="Revisar"
                  />
                )}
                {data.pendingDocs > 0 && (
                  <PendingRow
                    count={data.pendingDocs}
                    singular="profesional con documentación pendiente"
                    plural="profesionales con documentación pendiente"
                    href="/owner/documentacion"
                    cta="Verificar"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-brand-gray">Sin tareas pendientes. Todo al día.</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
