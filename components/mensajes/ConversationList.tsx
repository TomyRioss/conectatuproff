import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

export type ConversationListItem = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export type ConversationListProps = {
  conversations: ConversationListItem[];
  basePath: string;
  activeId?: string | null;
};

export default function ConversationList({ conversations, basePath, activeId = null }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <MessageSquare size={40} className="mx-auto text-brand-gray mb-3" />
        <p className="text-brand-dark font-semibold mb-1">Todavía no tenés conversaciones</p>
        <p className="text-sm text-brand-gray">Cuando reserves una cita, vas a poder chatear acá.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {conversations.map((c) => {
        const active = c.id === activeId;
        return (
          <Link
            key={c.id}
            href={`${basePath}/${c.id}`}
            className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40 ${
              active ? "bg-brand-violet/10 border border-brand-violet/30" : "border border-transparent hover:bg-brand-bg"
            }`}
          >
            <Avatar className="h-11 w-11 shrink-0">
              {c.otherAvatar && <AvatarImage src={c.otherAvatar} alt={c.otherName} />}
              <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
                {c.otherName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-dark truncate">{c.otherName}</p>
              <p className="text-xs text-brand-gray truncate">{c.lastMessage ?? "Sin mensajes todavía"}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
