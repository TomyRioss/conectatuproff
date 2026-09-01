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
import { nf, fmtCurrency, fmtDateTime } from "@/lib/owner/format";

interface TurnoRow {
  id: string;
  startAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  price: number | null;
  currency: string;
  professional: string;
  client: string;
  service: string | null;
}

interface AgendaData {
  total: number;
  upcoming: number;
  byStatus: Record<string, number>;
  appointments: TurnoRow[];
}

const STATUS_LABEL: Record<TurnoRow["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "No-show",
};

const STATUS_BADGE: Record<TurnoRow["status"], string> = {
  PENDING: "bg-status-pending-soft text-status-pending",
  CONFIRMED: "bg-brand-violet text-white",
  COMPLETED: "bg-brand-green text-brand-dark",
  CANCELLED: "bg-gray-200 text-brand-dark",
  NO_SHOW: "bg-brand-mauve text-white",
};

export default function AgendaDetailPage() {
  const [data, setData] = useState<AgendaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/agenda")
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
      <DetailHeader title="Agenda" subtitle="Turnos reservados en toda la plataforma" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-6">
          <MetricStrip
            items={[
              { label: "Turnos totales", value: nf.format(data.total) },
              { label: "Próximos", value: nf.format(data.upcoming), accent: true },
              { label: "Completados", value: nf.format(data.byStatus.COMPLETED ?? 0) },
              { label: "Cancelados", value: nf.format(data.byStatus.CANCELLED ?? 0) },
              { label: "No-show", value: nf.format(data.byStatus.NO_SHOW ?? 0) },
            ]}
          />

          {data.appointments.length === 0 ? (
            <EmptyState message="Todavía no se agendaron turnos." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{fmtDateTime(a.startAt)}</TableCell>
                      <TableCell>{a.professional}</TableCell>
                      <TableCell>{a.client}</TableCell>
                      <TableCell>{a.service ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">
                        {a.price ? fmtCurrency(a.price, a.currency) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                      </TableCell>
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
