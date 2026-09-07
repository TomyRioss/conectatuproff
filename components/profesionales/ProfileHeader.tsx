"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Star, MapPin } from "lucide-react";
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
    dniVerified: boolean;
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

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_8px_30px_-12px_rgba(26,26,46,0.25)] px-5 py-6 sm:px-8">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
        <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0">
          <Avatar className={`h-28 w-28 sm:h-32 sm:w-32 ${pro.isPro ? "ring-2 ring-brand-violet ring-offset-2 ring-offset-white" : "ring-1 ring-black/5"}`}>
            {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} />}
            <AvatarFallback className="bg-brand-violet text-white text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4 sm:mt-0 min-w-0">
          <h1 className="text-[22px] leading-tight sm:text-2xl font-bold tracking-tight text-brand-dark font-display">{fullName}</h1>
          <p className="text-sm text-brand-gray mt-0.5">@{username}</p>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap mt-2.5">
            {pro.isPro && <ProBadge />}
            {pro.dniVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green">
                <CheckCircle size={13} className="shrink-0" /> Perfil Verificado
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-brand-dark">
              <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-brand-gray">({reviewCount})</span>
            </span>
          </div>

          {(pro.specialty || pro.subcategory?.name) && (
            <p className="text-brand-dark font-semibold mt-3 text-[15px] sm:text-base">{pro.specialty ?? pro.subcategory?.name}</p>
          )}

          {pro.location && (
            <p className="flex items-start justify-center sm:justify-start gap-1 text-sm text-brand-gray mt-1 max-w-[260px] sm:max-w-none mx-auto sm:mx-0">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              <span className="text-balance">{pro.location}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
