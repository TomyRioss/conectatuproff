"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";

export function ContactCard({
  name,
  avatarSrc,
  professionalId,
  initialFavorited,
}: {
  name: string;
  avatarSrc: string | null;
  professionalId: string;
  initialFavorited: boolean;
}) {
  const scrollToChat = () => {
    document.getElementById("chat-widget")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11">
          {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
          <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
            {name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-brand-dark text-sm font-semibold">{name}</p>
          <p className="text-brand-gray text-xs">En línea · responde en ~10 min</p>
        </div>
        <FavoriteButton type="profesional" id={professionalId} initialFavorited={initialFavorited} />
      </div>

      <Button
        type="button"
        onClick={scrollToChat}
        className="w-full mt-4 bg-brand-dark hover:bg-brand-dark/90 text-white"
      >
        <CalendarDays size={14} className="mr-2" /> Agenda tú cita
      </Button>
    </div>
  );
}
