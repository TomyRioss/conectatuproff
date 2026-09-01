"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DetailHeader, MetricStrip, EmptyState, ErrorState, LoadingRows } from "@/components/owner/dashboard/DetailHeader";
import { nf, fmtCurrency, fmtDate } from "@/lib/owner/format";

interface ProRow {
  id: string;
  name: string;
  email: string;
  proSince: string | null;
  mpSubscriptionStatus: string;
}

interface IngresosData {
  planPrice: number;
  paidProfessionals: number;
  totalProfessionals: number;
  conversionRate: number;
  mrr: number;
  avgServicePrice: number | null;
  pricedServices: number;
  proProfessionals: ProRow[];
}

export default function IngresosDetailPage() {
  const [data, setData] = useState<IngresosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/ingresos")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <DetailHeader title="Ingresos" subtitle="Plan Pro+ y valor promedio del catálogo" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-6">
          <MetricStrip
            items={[
              { label: "MRR (Pro+)", value: fmtCurrency(data.mrr), accent: true },
              { label: "Usuarios pagos", value: nf.format(data.paidProfessionals) },
              {
                label: "Conversión a Pro+",
                value: `${(data.conversionRate * 100).toFixed(1)}%`,
              },
              {
                label: "Precio del plan",
                value: data.planPrice > 0 ? fmtCurrency(data.planPrice) : "Gratis",
              },
              {
                label: "Costo prom. servicio",
                value: data.avgServicePrice ? fmtCurrency(data.avgServicePrice) : "—",
              },
            ]}
          />

          <p className="text-sm text-brand-gray">
            {nf.format(data.paidProfessionals)} de {nf.format(data.totalProfessionals)} profesionales
            tienen el plan Pro+ ({data.planPrice > 0 ? `${fmtCurrency(data.planPrice)}/mes` : "gratuito"}) ·{" "}
            {nf.format(data.pricedServices)} servicios con precio cargado.
          </p>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gray">
              Suscripciones Pro+
            </h2>
            {data.proProfessionals.length === 0 ? (
              <EmptyState message="Todavía no hay profesionales con plan Pro+." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado suscripción</TableHead>
                      <TableHead>Pro+ desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.proProfessionals.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-brand-dark">{p.name}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-brand-violet text-white">
                            {p.mpSubscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.proSince ? fmtDate(p.proSince) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
