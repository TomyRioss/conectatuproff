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
import { nf, fmtDate } from "@/lib/owner/format";

interface ClienteRow {
  id: string;
  name: string;
  email: string;
  location: string | null;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  appointments: number;
  reviews: number;
}

interface ClientesData {
  total: number;
  newLast30Days: number;
  verified: number;
  clients: ClienteRow[];
}

export default function ClientesDetailPage() {
  const [data, setData] = useState<ClientesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/clientes")
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
      <DetailHeader title="Clientes" subtitle="Personas registradas como clientes en la plataforma" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-6">
          <MetricStrip
            items={[
              { label: "Clientes totales", value: nf.format(data.total) },
              { label: "Nuevos (30 días)", value: nf.format(data.newLast30Days), accent: true },
              { label: "Verificados", value: nf.format(data.verified) },
            ]}
          />

          {data.clients.length === 0 ? (
            <EmptyState message="Todavía no hay clientes registrados." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Turnos</TableHead>
                    <TableHead>Reseñas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-brand-dark">
                        {c.name}
                        {c.isVerified ? (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Verificado
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.location ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{nf.format(c.appointments)}</TableCell>
                      <TableCell className="tabular-nums">{nf.format(c.reviews)}</TableCell>
                      <TableCell>
                        {c.isBanned ? (
                          <Badge variant="destructive">Baneado</Badge>
                        ) : c.isActive ? (
                          <Badge className="bg-brand-green text-brand-dark">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>{fmtDate(c.createdAt)}</TableCell>
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
