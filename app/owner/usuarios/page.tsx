"use client";

import { useEffect, useState } from "react";
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

type Role = "CLIENT" | "PROFESSIONAL" | "ADMIN";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  role: string;
}

function UsersTable({ role }: { role: Role }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/owner/usuarios?role=${role}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <p className="text-brand-gray text-sm mt-4">Cargando...</p>;
  if (error) return <p className="text-red-500 text-sm mt-4">Error: {error}</p>;
  if (!users.length) return <p className="text-brand-gray text-sm mt-4">Sin usuarios.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Creado</TableHead>
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
                <Badge className="bg-brand-green text-white">Activo</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </TableCell>
            <TableCell>{new Date(u.createdAt).toLocaleDateString("es-AR")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
        </TabsList>
        <TabsContent value="CLIENT">
          <UsersTable role="CLIENT" />
        </TabsContent>
        <TabsContent value="PROFESSIONAL">
          <UsersTable role="PROFESSIONAL" />
        </TabsContent>
        <TabsContent value="ADMIN">
          <UsersTable role="ADMIN" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
