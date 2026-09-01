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
import { nf, fmtDateTime } from "@/lib/owner/format";

interface ConversacionRow {
  id: string;
  professional: string;
  client: string;
  botEnabled: boolean;
  messages: number;
  updatedAt: string;
  lastMessage: string | null;
  escalated: boolean;
}

interface ConversacionesData {
  total: number;
  active: number;
  escalated: number;
  conversations: ConversacionRow[];
}

export default function ConversacionesDetailPage() {
  const [data, setData] = useState<ConversacionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/dashboard/conversaciones")
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
      <DetailHeader title="Conversaciones" subtitle="Chats entre clientes y profesionales" />

      {loading && <LoadingRows />}
      {error && <ErrorState message={error} />}

      {data && !loading && (
        <div className="space-y-6">
          <MetricStrip
            items={[
              { label: "Conversaciones totales", value: nf.format(data.total) },
              { label: "Activas (7 días)", value: nf.format(data.active), accent: true },
              { label: "Escaladas a humano", value: nf.format(data.escalated) },
            ]}
          />

          {data.conversations.length === 0 ? (
            <EmptyState message="Todavía no hay conversaciones." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Último mensaje</TableHead>
                    <TableHead>Mensajes</TableHead>
                    <TableHead>Bot</TableHead>
                    <TableHead>Actualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.conversations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-brand-dark">{c.professional}</TableCell>
                      <TableCell>{c.client}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {c.lastMessage ?? "—"}
                        {c.escalated ? (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Escalada
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular-nums">{nf.format(c.messages)}</TableCell>
                      <TableCell>
                        {c.botEnabled ? (
                          <Badge className="bg-brand-violet text-white">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Apagado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{fmtDateTime(c.updatedAt)}</TableCell>
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
