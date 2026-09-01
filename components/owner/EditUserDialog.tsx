"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EditableUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  isActive: boolean;
  isBanned: boolean;
  role: string;
}

const ROLES = ["CLIENT", "PROFESSIONAL", "ADMIN", "OWNER", "SUPER_ADMIN"] as const;

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: EditableUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [isActive, setIsActive] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  // Sync local state when a new user opens.
  if (user && user.id !== hydratedId) {
    setHydratedId(user.id);
    setName(user.name ?? "");
    setEmail(user.email);
    setUsername(user.username ?? "");
    setRole(user.role);
    setIsActive(user.isActive);
    setIsBanned(user.isBanned);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/owner/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, name, email, username, role, isActive, isBanned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      toast.success("Usuario actualizado");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-username">Username</Label>
            <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">Rol</Label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-brand-dark">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-dark">
              <input type="checkbox" checked={isBanned} onChange={(e) => setIsBanned(e.target.checked)} />
              Baneado
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
