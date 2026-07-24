"use client";

import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ConversationList, { type ConversationListItem } from "./ConversationList";

export default function MessagesShell({
  conversations,
  basePath,
  children,
}: {
  conversations: ConversationListItem[];
  basePath: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = pathname === basePath ? null : pathname.slice(basePath.length + 1);
  const isDetail = activeId !== null;

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white">
      <aside
        className={`w-full lg:w-80 shrink-0 border-r border-gray-200 flex-col overflow-y-auto ${
          isDetail ? "hidden lg:flex" : "flex"
        }`}
      >
        <h1 className="text-lg font-bold text-brand-dark px-4 py-4 border-b border-gray-200">Mensajes</h1>
        <ConversationList conversations={conversations} basePath={basePath} activeId={activeId} />
      </aside>
      <section className={`flex-1 flex-col ${isDetail ? "flex" : "hidden lg:flex"}`}>
        {children ?? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare size={40} className="text-brand-gray mb-3" />
            <p className="text-brand-dark font-semibold mb-1">Elegí una conversación</p>
            <p className="text-sm text-brand-gray">Seleccioná un chat de la izquierda para ver los mensajes.</p>
          </div>
        )}
      </section>
    </div>
  );
}
