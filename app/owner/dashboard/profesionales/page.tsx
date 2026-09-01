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

interface ProfesionalRow {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  rating: number;
  isPro: boolean;
  mpSubscriptionStatus: string;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  proSince: string | null;
  createdAt: string;
  services: number;
  appointments: number;
  reviews: number;
}

interface ProfesionalesData {
  total: number;
  pro: number;
  free: number;
  avgRating: number;
  mrr: number;
  planPrice: number;
  professionals: ProfesionalRow[];
}

export default function ProfesionalesDetailPage() {
  const [data, setData] = useState<ProfesionalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/profesionales")
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
      <DetailHeader title="Profesionales" subtitle="Prestadores de servicio dados de alta en la plataforma" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-6">
          <MetricStrip
            items={[
              { label: "Profesionales totales", value: nf.format(data.total) },
              { label: "Con plan Pro+", value: nf.format(data.pro), accent: true },
              { label: "Plan gratuito", value: nf.format(data.free) },
              { label: "Rating promedio", value: data.avgRating.toFixed(1) },
              { label: "MRR generado", value: fmtCurrency(data.mrr) },
              {
                label: "Precio del plan",
                value: data.planPrice > 0 ? `${fmtCurrency(data.planPrice)}/mes` : "Gratis",
              },
            ]}
          />

          {data.professionals.length === 0 ? (
            <EmptyState message="Todavía no hay profesionales registrados." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Servicios</TableHead>
                    <TableHead>Turnos</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.professionals.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-brand-dark">
                        {p.name}
                        <p className="text-xs font-normal text-brand-gray">{p.email}</p>
                      </TableCell>
                      <TableCell>{p.specialty ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{p.rating.toFixed(1)}</TableCell>
                      <TableCell className="tabular-nums">{nf.format(p.services)}</TableCell>
                      <TableCell className="tabular-nums">{nf.format(p.appointments)}</TableCell>
                      <TableCell>
                        {p.isPro ? (
                          <Badge className="bg-brand-violet text-white">Pro+</Badge>
                        ) : (
                          <Badge variant="secondary">Gratis</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.isBanned ? (
                          <Badge variant="destructive">Baneado</Badge>
                        ) : p.isActive ? (
                          <Badge className="bg-brand-green text-brand-dark">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>{fmtDate(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
