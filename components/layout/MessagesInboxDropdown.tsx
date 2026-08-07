"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Conversation = {
  id: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export default function MessagesInboxDropdown() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;
  const basePath = role === "PROFESSIONAL" ? "/profesional/mensajes" : "/cliente/mensajes";
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/mensajes");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(id: string) {
    setOpen(false);
    router.push(`${basePath}/${id}`);
  }

  if (status !== "authenticated") {
    return (
      <button
        aria-label="Mensajes"
        className="relative p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors"
        disabled
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Mensajes"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-brand-gray hover:text-brand-dark hover:bg-white transition-colors"
      >
        <MessageSquare size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-brand-dark">Bandeja de entrada</p>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {conversations.length === 0 ? (
              <p className="text-sm text-brand-gray text-center py-8">Sin mensajes</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-bg transition-colors flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-violet/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {c.otherAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.otherAvatar} alt={c.otherName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-brand-violet text-sm font-semibold">{c.otherName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-dark truncate">{c.otherName}</p>
                    {c.lastMessage && <p className="text-xs text-brand-gray mt-0.5 line-clamp-2">{c.lastMessage}</p>}
                    {c.lastMessageAt && (
                      <p className="text-[10px] text-brand-gray/60 mt-1">
                        {new Date(c.lastMessageAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <button onClick={() => { setOpen(false); router.push(basePath); }} className="text-xs text-brand-violet hover:underline">
              Ver todos los mensajes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
