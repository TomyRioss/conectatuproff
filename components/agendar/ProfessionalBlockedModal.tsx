"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ProfessionalBlockedModal({ username }: { username: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [switching, setSwitching] = useState(false);

  async function handleModoCliente() {
    if (switching) return;
    setSwitching(true);
    try {
      await update({ role: "CLIENT" });
      router.push(`/perfil/profesional/${username}/agendar`);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && router.push(`/perfil/profesional/${username}`)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Necesitás una cuenta de cliente</DialogTitle>
          <DialogDescription>
            Estás autenticado como profesional. Cambiá a modo cliente para agendar una cita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/perfil/profesional/${username}`)}
          >
            Volver al perfil
          </Button>
          <Button
            className="bg-brand-green hover:opacity-90"
            disabled={switching}
            onClick={handleModoCliente}
          >
            {switching ? "Cambiando..." : "Cambiar a modo cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
