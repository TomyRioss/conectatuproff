"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditUserDialog, type EditableUser } from "@/components/owner/EditUserDialog";

type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

interface UserRow extends EditableUser {
  createdAt: string;
}

async function mutate(method: "PATCH" | "DELETE", body: object) {
  const res = await fetch("/api/owner/usuarios", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error");
}

function UsersTable({
  role,
  status,
}: {
  role?: Role;
  status: "active" | "archived";
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ status });
    if (role) q.set("role", role);
    fetch(`/api/owner/usuarios?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [role, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id: string, action: () => Promise<void>, okMsg: string) {
    setBusy(id);
    try {
      await action();
      toast.success(okMsg);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  if (loading) return <p className="text-brand-gray text-sm mt-4">Cargando...</p>;
  if (error) return <p className="text-red-500 text-sm mt-4">Error: {error}</p>;
  if (!users.length) return <p className="text-brand-gray text-sm mt-4">Sin usuarios.</p>;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name ?? "—"}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.username ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{u.role}</Badge>
              </TableCell>
              <TableCell>
                {u.isBanned ? (
                  <Badge variant="destructive">Baneado</Badge>
                ) : u.isActive ? (
                  <Badge className="bg-brand-green text-brand-dark">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleDateString("es-AR")}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {status === "active" ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(u);
                        setEditOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === u.id}
                      onClick={() =>
                        run(u.id, () => mutate("PATCH", { id: u.id, isActive: false }), "Usuario archivado")
                      }
                    >
                      Archivar
                    </Button>
                  </div>
                ) : confirmDelete === u.id ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === u.id}
                      onClick={() => run(u.id, () => mutate("DELETE", { id: u.id }), "Usuario eliminado")}
                    >
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === u.id}
                      onClick={() =>
                        run(u.id, () => mutate("PATCH", { id: u.id, isActive: true }), "Usuario restaurado")
                      }
                    >
                      Restaurar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(u.id)}>
                      Eliminar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditUserDialog
        user={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={load}
      />
    </>
  );
}

export default function UsuariosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark font-display mb-6">Usuarios</h1>
      <Tabs defaultValue="CLIENT">
        <TabsList className="mb-4">
          <TabsTrigger value="CLIENT">Clientes</TabsTrigger>
          <TabsTrigger value="PROFESSIONAL">Profesionales</TabsTrigger>
          <TabsTrigger value="ADMIN">Admins</TabsTrigger>
          <TabsTrigger value="ARCHIVED">Archivados</TabsTrigger>
        </TabsList>
        <TabsContent value="CLIENT">
          <UsersTable role="CLIENT" status="active" />
        </TabsContent>
        <TabsContent value="PROFESSIONAL">
          <UsersTable role="PROFESSIONAL" status="active" />
        </TabsContent>
        <TabsContent value="ADMIN">
          <UsersTable role="ADMIN" status="active" />
        </TabsContent>
        <TabsContent value="ARCHIVED">
          <UsersTable status="archived" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
