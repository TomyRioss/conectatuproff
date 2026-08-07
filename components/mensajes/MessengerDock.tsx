"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle, X, ChevronDown, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatThread from "./ChatThread";

type ConversationItem = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

const POLL_MS = 30000;
const MAX_OPEN = 3;

export default function MessengerDock() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAuthed = status === "authenticated" && (role === "CLIENT" || role === "PROFESSIONAL");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);

  const inMensajes = pathname?.includes("/mensajes");

  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;

    async function fetchList() {
      try {
        const res = await fetch("/api/mensajes");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setConversations(data.conversations ?? []);
      } catch (e) {
        console.error("fetch mensajes list", e);
      }
    }

    fetchList();
    const interval = setInterval(fetchList, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthed]);

  const openChat = useCallback((id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      return next.length > MAX_OPEN ? next.slice(next.length - MAX_OPEN) : next;
    });
  }, []);

  const closeChat = useCallback((id: string) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
    setMinimizedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setMinimizedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  if (!isAuthed || inMensajes || conversations.length === 0) return null;

  const basePath = role === "PROFESSIONAL" ? "/profesional/mensajes" : "/cliente/mensajes";

  return (
    <div className="hidden lg:flex fixed bottom-0 right-44 z-40 items-end gap-3 flex-row-reverse">
      <div
        className={`w-72 rounded-t-xl bg-white border border-b-0 border-gray-200 shadow-2xl overflow-hidden flex flex-col ${listOpen ? "h-[420px]" : ""}`}
      >
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-brand-dark text-white shrink-0"
        >
          <span className="flex items-center gap-2 font-semibold text-sm">
            <MessageCircle size={16} /> Mensajes
          </span>
          <ChevronDown size={16} className={`transition-transform ${listOpen ? "" : "rotate-180"}`} />
        </button>
        {listOpen && (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openChat(c.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-bg text-left border-b border-gray-100 last:border-b-0"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {c.otherAvatar && <AvatarImage src={c.otherAvatar} alt={c.otherName} />}
                  <AvatarFallback className="bg-brand-violet text-white text-sm font-semibold">
                    {c.otherName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-dark truncate">{c.otherName}</p>
                  <p className="text-xs text-brand-gray truncate">{c.lastMessage ?? "Sin mensajes todavía"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {openIds.map((id) => {
        const convo = conversations.find((c) => c.id === id);
        if (!convo) return null;
        const minimized = minimizedIds.includes(id);
        return (
          <div
            key={id}
            className={`w-80 rounded-t-xl bg-white border border-b-0 border-gray-200 shadow-2xl overflow-hidden flex flex-col ${minimized ? "" : "h-[420px]"}`}
          >
            <button
              type="button"
              onClick={() => toggleMinimize(id)}
              className="flex items-center gap-2 px-3 py-2.5 bg-brand-dark text-white shrink-0"
            >
              <Avatar className="h-7 w-7 shrink-0">
                {convo.otherAvatar && <AvatarImage src={convo.otherAvatar} alt={convo.otherName} />}
                <AvatarFallback className="bg-brand-violet text-white text-xs font-semibold">
                  {convo.otherName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold truncate flex-1 text-left">{convo.otherName}</p>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize(id);
                }}
                onKeyDown={(e) => e.key === "Enter" && toggleMinimize(id)}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Minimizar chat"
              >
                <Minus size={16} />
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat(id);
                }}
                onKeyDown={(e) => e.key === "Enter" && closeChat(id)}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Cerrar chat"
              >
                <X size={16} />
              </span>
            </button>
            {!minimized && (
              <div className="flex-1 min-h-0">
                <ChatThread
                  conversationId={id}
                  currentRole={role as "CLIENT" | "PROFESSIONAL"}
                  otherName={convo.otherName}
                  otherAvatar={convo.otherAvatar}
                  backHref={basePath}
                  hideHeader
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
