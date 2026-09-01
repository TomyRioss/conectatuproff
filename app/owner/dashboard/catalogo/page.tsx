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

interface ServicioRow {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  status: "ACTIVE" | "DRAFT" | "PAUSED";
  category: string | null;
  professional: string;
  createdAt: string;
}

interface CategoriaRow {
  id: string;
  name: string;
  services: number;
  professionals: number;
}

interface CatalogoData {
  total: number;
  active: number;
  draft: number;
  paused: number;
  avgPrice: number | null;
  categories: CategoriaRow[];
  services: ServicioRow[];
}

const STATUS_LABEL: Record<ServicioRow["status"], string> = {
  ACTIVE: "Activo",
  DRAFT: "Borrador",
  PAUSED: "Pausado",
};

const STATUS_BADGE: Record<ServicioRow["status"], string> = {
  ACTIVE: "bg-brand-green text-brand-dark",
  DRAFT: "bg-gray-200 text-brand-dark",
  PAUSED: "bg-status-pending-soft text-status-pending",
};

export default function CatalogoDetailPage() {
  const [data, setData] = useState<CatalogoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/catalogo")
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
      <DetailHeader title="Catálogo" subtitle="Servicios y categorías publicados en la plataforma" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-8">
          <MetricStrip
            items={[
              { label: "Servicios totales", value: nf.format(data.total) },
              { label: "Activos", value: nf.format(data.active), accent: true },
              { label: "Borradores", value: nf.format(data.draft) },
              { label: "Pausados", value: nf.format(data.paused) },
              {
                label: "Costo promedio",
                value: data.avgPrice ? fmtCurrency(data.avgPrice) : "—",
              },
            ]}
          />

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gray">
              Categorías
            </h2>
            {data.categories.length === 0 ? (
              <EmptyState message="Todavía no hay categorías cargadas." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Profesionales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.categories.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-brand-dark">{c.name}</TableCell>
                        <TableCell className="tabular-nums">{nf.format(c.services)}</TableCell>
                        <TableCell className="tabular-nums">{nf.format(c.professionals)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gray">
              Servicios
            </h2>
            {data.services.length === 0 ? (
              <EmptyState message="Todavía no se crearon servicios." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-brand-dark">{s.title}</TableCell>
                        <TableCell>{s.professional}</TableCell>
                        <TableCell>{s.category ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">
                          {s.price ? fmtCurrency(s.price, s.currency) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                        </TableCell>
                        <TableCell>{fmtDate(s.createdAt)}</TableCell>
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
