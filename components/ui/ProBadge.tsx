import { Crown } from "lucide-react";

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-brand-violet to-brand-green px-2.5 py-1 rounded-full shadow-sm ${className}`}
    >
      <Crown size={12} className="fill-white" />
      Perfil Pro+
    </span>
  );
}
