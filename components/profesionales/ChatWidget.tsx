"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const QUICK_REPLIES = ["Quiero una consulta", "Tengo dudas", "¿Cuánto sale?"];

export function ChatWidget({
  name,
  professionalId,
  username,
  avatarSrc,
}: {
  name: string;
  professionalId: string;
  username: string;
  avatarSrc: string | null;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isClient = role === "CLIENT";

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; body: string; senderRole: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Si ya hay conversación con este profesional, se reutiliza.
  useEffect(() => {
    if (!isClient) return;
    fetch("/api/mensajes")
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data) => {
        const existing = (data.conversations ?? []).find(
          (c: { professionalId?: string; id: string }) => c.professionalId === professionalId
        );
        if (existing) setConversationId(existing.id);
      })
      .catch(() => {});
  }, [isClient, professionalId]);

  useEffect(() => {
    if (!conversationId) return;
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/mensajes/${conversationId}`)
        .then((r) => (r.ok ? r.json() : { messages: [] }))
        .then((data) => setMessages(data.messages ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(text?: string) {
    const body = (text ?? message).trim();
    if (!body) return;
    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=/perfil/profesional/${username}`);
      return;
    }
    if (!isClient) {
      toast.error("Solo los clientes pueden chatear con profesionales.");
      return;
    }

    setSending(true);
    setMessage("");
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    setMessages((prev) => [...prev, { id: optimisticId, body, senderRole: "CLIENT" }]);

    try {
      let convoId = conversationId;
      if (!convoId) {
        const res = await fetch("/api/mensajes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professionalId, body }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error ?? "No se pudo iniciar la conversación.");
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setMessage(body);
          return;
        }
        convoId = data.conversationId;
        setConversationId(convoId);
      } else {
        const res = await fetch(`/api/mensajes/${convoId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error ?? "No se pudo enviar el mensaje.");
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          setMessage(body);
          return;
        }
      }
      toast.success("Mensaje enviado. El profesional te va a responder acá o por la app.");
    } catch {
      toast.error("Ocurrió un error al enviar el mensaje.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setMessage(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="chat-widget" className="max-w-7xl mx-auto px-4 mt-6 mb-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div className="min-w-0">
      <div className="bg-brand-bg border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-white">
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
              <AvatarFallback className="bg-brand-violet text-white text-sm">
                {name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brand-green ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <p className="text-brand-dark text-base font-semibold leading-tight truncate">{name}</p>
            <p className="text-brand-gray text-xs mt-0.5">
              <span className="font-medium text-brand-dark">En línea</span> · responde en ~10 min
            </p>
          </div>
        </div>

        <div className="px-4 py-4">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {loading && <p className="text-xs text-brand-gray">Cargando mensajes...</p>}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    m.senderRole === "CLIENT"
                      ? "self-end bg-brand-violet text-white rounded-2xl rounded-br-sm"
                      : "self-start bg-white border border-gray-200 text-brand-dark rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {m.body}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] sm:max-w-[75%] shadow-sm">
              <p className="text-xs text-brand-violet font-semibold mb-1">{name}</p>
              <p className="text-sm text-brand-dark leading-relaxed">
                ¿Tenés dudas sobre qué tratamiento es ideal para vos? ¡Escribime y te asesoro sin cargo! 😊
              </p>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => send(reply)}
                  className="cursor-pointer text-sm min-h-11 sm:min-h-9 bg-white border border-brand-violet/30 text-brand-dark font-medium px-4 py-1.5 rounded-full shadow-sm hover:border-brand-violet hover:bg-brand-violet hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-200">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Escribí tu consulta..."
            className="flex-1 min-w-0 bg-brand-bg border border-gray-200 text-brand-dark placeholder:text-brand-gray text-base sm:text-sm rounded-full px-4 py-2.5 outline-none focus:bg-white focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20 transition-all"
          />
          <button
            type="button"
            aria-label="Enviar mensaje"
            disabled={sending || !message.trim()}
            onClick={() => send()}
            className="cursor-pointer h-10 w-10 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 shadow-sm hover:brightness-95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:bg-gray-200 disabled:text-brand-gray disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {conversationId && isClient && (
          <Link
            href={`/cliente/mensajes/${conversationId}`}
            className="block px-4 py-2.5 text-center text-sm font-medium text-brand-violet hover:underline border-t border-gray-100 bg-white"
          >
            Ver la conversación completa
          </Link>
        )}
      </div>
      </div>
    </div>
  );
}
