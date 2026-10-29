import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/ProBadge";

export type ServiceProfessionalHeaderData = {
  username?: string | null;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  image?: string | null;
  specialty?: string | null;
  location?: string | null;
  isPro?: boolean;
};

export function ServiceProfessionalHeader({ professional }: { professional: ServiceProfessionalHeaderData }) {
  const fullName = `${professional.firstName} ${professional.lastName}`;
  const initials = `${professional.firstName[0] ?? ""}${professional.lastName[0] ?? ""}`.toUpperCase();
  const avatarSrc = professional.avatarUrl
    ? `/api/avatar?key=${encodeURIComponent(professional.avatarUrl)}`
    : professional.image;
  const content = (
    <>
      <Avatar className="h-12 w-12">
        {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} />}
        <AvatarFallback className="bg-brand-violet font-semibold text-white">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold text-brand-dark">{fullName}</p>
          {professional.isPro && <ProBadge />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-brand-gray">
          {professional.specialty && <span>{professional.specialty}</span>}
          {professional.location && <span className="inline-flex items-center gap-1"><MapPin size={13} />{professional.location}</span>}
        </div>
      </div>
    </>
  );

  return professional.username ? (
    <Link href={`/perfil/profesional/${professional.username}`} className="mb-7 flex items-center gap-3 border-b border-gray-200 pb-5 transition-colors hover:text-brand-violet sm:mb-9">
      {content}
    </Link>
  ) : (
    <div className="mb-7 flex items-center gap-3 border-b border-gray-200 pb-5 sm:mb-9">{content}</div>
  );
}
