"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Star, MapPin } from "lucide-react";
import { useIsOnline } from "@/lib/hooks/use-online-users";
import { ProBadge } from "@/components/ui/ProBadge";

type ProfileHeaderProps = {
  pro: {
    userId: string;
    firstName: string;
    lastName: string;
    specialty: string | null;
    location: string | null;
    isVerified: boolean;
    isPro: boolean;
    subcategory: { name: string } | null;
  };
  username: string;
  avatarSrc: string | null;
  avgRating: number;
  reviewCount: number;
};

export function ProfileHeader({ pro, username, avatarSrc, avgRating, reviewCount }: ProfileHeaderProps) {
  const fullName = `${pro.firstName} ${pro.lastName}`;
  const initials = `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase();
  const isOnline = useIsOnline(pro.userId);

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <Avatar className={`h-32 w-32 ${pro.isPro ? "ring-2 ring-brand-violet ring-offset-2" : ""}`}>
            {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} />}
            <AvatarFallback className="bg-brand-violet text-white text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-[3px] border-white ${
              isOnline ? "bg-brand-green" : "bg-brand-gray"
            }`}
            title={isOnline ? "En línea" : "Desconectado"}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-brand-dark">{fullName}</h1>
            <span className="text-brand-gray">@{username}</span>
            {pro.isPro && <ProBadge />}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isOnline ? "bg-brand-green/10 text-brand-green" : "bg-brand-bg text-brand-gray border border-gray-200"
              }`}
            >
              {isOnline ? "En línea" : "Desconectado"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-sm">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-brand-dark">{avgRating.toFixed(1)}</span>
            <span className="text-brand-gray">({reviewCount})</span>
          </div>

          {(pro.specialty || pro.subcategory?.name) && (
            <p className="text-brand-dark font-medium mt-2">{pro.specialty ?? pro.subcategory?.name}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-1">
            {pro.location && (
              <span className="flex items-center text-sm text-brand-gray">
                <MapPin size={13} className="mr-1" /> {pro.location}
              </span>
            )}
            {pro.isVerified && (
              <span className="flex items-center text-sm text-brand-green font-medium">
                <CheckCircle size={13} className="mr-1" /> Perfil Verificado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
