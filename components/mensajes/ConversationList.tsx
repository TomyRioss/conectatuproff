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
};

export default function ConversationList({ conversations, basePath }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <MessageSquare size={40} className="mx-auto text-brand-gray mb-3" />
        <p className="text-brand-dark font-semibold mb-1">Todavía no tenés conversaciones</p>
        <p className="text-sm text-brand-gray">Cuando reserves una cita, vas a poder chatear acá.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`${basePath}/${c.id}`}
          className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3 hover:border-brand-violet/40 transition-colors"
        >
          <Avatar className="h-11 w-11">
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
      ))}
    </div>
  );
}
