"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Message = {
  id: string;
  senderRole: "CLIENT" | "PROFESSIONAL";
  body: string;
  createdAt: string;
};

export type ChatThreadProps = {
  conversationId: string;
  currentRole: "CLIENT" | "PROFESSIONAL";
  otherName: string;
  otherAvatar: string | null;
  backHref: string;
};

const POLL_MS = 30000;

export default function ChatThread({ conversationId, currentRole, otherName, otherAvatar, backHref }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchNew() {
      const since = lastCreatedAtRef.current;
      const url = since
        ? `/api/mensajes/${conversationId}?since=${encodeURIComponent(since)}`
        : `/api/mensajes/${conversationId}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const newMessages: Message[] = data.messages ?? [];
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
          lastCreatedAtRef.current = newMessages[newMessages.length - 1].createdAt;
        }
      } catch (e) {
        console.error("fetchNew mensajes", e);
      } finally {
        setLoading(false);
      }
    }

    fetchNew();
    const interval = setInterval(fetchNew, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/mensajes/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        toast.error("No se pudo enviar el mensaje, intentá de nuevo.");
        setInput(text);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      lastCreatedAtRef.current = data.message.createdAt;
    } catch (e) {
      console.error("send mensaje", e);
      toast.error("Ocurrió un error al enviar el mensaje.");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-brand-dark hover:bg-gray-50 shrink-0 lg:hidden"
        >
          <ArrowLeft size={16} />
        </Link>
        <Avatar className="h-9 w-9">
          {otherAvatar && <AvatarImage src={otherAvatar} alt={otherName} />}
          <AvatarFallback className="bg-brand-violet text-white text-xs font-semibold">
            {otherName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-brand-dark truncate">{otherName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-end gap-2 bg-brand-bg">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-brand-gray">Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-brand-gray">Todavía no hay mensajes. Escribí el primero.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === currentRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-brand-violet text-white" : "bg-white border border-gray-200 text-brand-dark"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm text-brand-dark placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white disabled:opacity-40 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
