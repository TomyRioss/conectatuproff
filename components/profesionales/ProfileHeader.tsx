import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, MapPin, Zap } from "lucide-react";

type ProfileHeaderProps = {
  pro: {
    firstName: string;
    lastName: string;
    specialty: string | null;
    location: string | null;
    isVerified: boolean;
    subcategory: { name: string } | null;
  };
  avatarSrc: string | null;
  avgRating: number;
  reviewCount: number;
};

export function ProfileHeader({ pro, avatarSrc, avgRating, reviewCount }: ProfileHeaderProps) {
  const initials = `${pro.firstName[0] ?? ""}${pro.lastName[0] ?? ""}`.toUpperCase();
  const fullName = `${pro.firstName} ${pro.lastName}`;

  return (
    <div className="relative">
      <div className="h-28 bg-gradient-to-br from-brand-violet to-brand-dark" />

      <div className="max-w-2xl mx-auto px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 pb-6 pt-4">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={fullName} />}
              <AvatarFallback className="bg-brand-violet text-white text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center mt-3">
            <h1 className="text-xl font-bold text-brand-dark">{fullName}</h1>
            {(pro.specialty || pro.subcategory?.name) && (
              <p className="text-brand-violet font-medium text-sm mt-0.5">
                {pro.specialty ?? pro.subcategory?.name}
              </p>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold text-brand-dark">{avgRating.toFixed(1)}</span>
              <span className="text-brand-gray">· {reviewCount} reseñas</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {pro.isVerified && (
              <Badge className="bg-brand-green/10 text-brand-green border border-brand-green/30 font-medium">
                <CheckCircle size={12} className="mr-1" /> Verificada
              </Badge>
            )}
            <Badge className="bg-brand-violet/10 text-brand-violet border border-brand-violet/30 font-medium">
              <Zap size={12} className="mr-1" /> Responde rápido
            </Badge>
            {pro.location && (
              <Badge className="bg-brand-bg text-brand-gray border border-gray-200 font-medium">
                <MapPin size={12} className="mr-1" /> {pro.location}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
