"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, BotOff, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  senderRole: "CLIENT" | "PROFESSIONAL" | "BOT" | "SYSTEM";
  body: string;
  createdAt: string;
  escalatesToHuman?: boolean;
};

export type ChatThreadProps = {
  conversationId: string;
  currentRole: "CLIENT" | "PROFESSIONAL";
  otherName: string;
  otherAvatar: string | null;
  backHref: string;
  initialBotEnabled?: boolean;
  hideHeader?: boolean;
};

const POLL_MS = 30000;

export default function ChatThread({
  conversationId,
  currentRole,
  otherName,
  otherAvatar,
  backHref,
  initialBotEnabled = true,
  hideHeader = false,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [botEnabled, setBotEnabled] = useState(initialBotEnabled);
  const [togglingBot, setTogglingBot] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
        if (typeof data.botEnabled === "boolean") setBotEnabled(data.botEnabled);
        const newMessages: Message[] = data.messages ?? [];
        if (newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            return [...prev, ...newMessages.filter((m) => !existingIds.has(m.id))];
          });
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
  }, [messages.length, botTyping]);

  function escalationNotice(): Message {
    return {
      id: `escalation-${Date.now()}`,
      senderRole: "SYSTEM",
      body: "Alerta enviada al profesional, se unirá a la conversación en breve.",
      createdAt: new Date().toISOString(),
    };
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderRole: currentRole,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const willAwaitBot = currentRole === "CLIENT" && botEnabled;
    if (willAwaitBot) setBotTyping(true);

    try {
      const res = await fetch(`/api/mensajes/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        toast.error("No se pudo enviar el mensaje, intentá de nuevo.");
        setInput(text);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }
      const data = await res.json();
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== tempId);
        const withMine = withoutOptimistic.some((m) => m.id === data.message.id)
          ? withoutOptimistic
          : [...withoutOptimistic, data.message];
        const withBot =
          data.botMessage && !withMine.some((m) => m.id === data.botMessage.id) ? [...withMine, data.botMessage] : withMine;
        return data.botMessage?.escalatesToHuman ? [...withBot, escalationNotice()] : withBot;
      });
      const last = data.botMessage ?? data.message;
      lastCreatedAtRef.current = last.createdAt;
      if (currentRole === "PROFESSIONAL") setBotEnabled(false);
    } catch (e) {
      console.error("send mensaje", e);
      toast.error("Ocurrió un error al enviar el mensaje.");
      setInput(text);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setBotTyping(false);
      setSending(false);
    }
  }

  async function toggleBot() {
    if (togglingBot) return;
    setTogglingBot(true);
    const next = !botEnabled;
    try {
      const res = await fetch(`/api/mensajes/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botEnabled: next }),
      });
      if (!res.ok) {
        toast.error("No se pudo cambiar el estado del asistente.");
        return;
      }
      setBotEnabled(next);
      toast.success(next ? "Asistente reactivado." : "Asistente desactivado.");
    } catch {
      toast.error("No se pudo cambiar el estado del asistente.");
    } finally {
      setTogglingBot(false);
    }
  }

  async function askForProfessional() {
    try {
      const res = await fetch(`/api/mensajes/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalate: true }),
      });
      if (!res.ok) {
        toast.error("No se pudo avisar al profesional, intentá de nuevo.");
        return;
      }
      setMessages((prev) => [...prev, escalationNotice()]);
    } catch {
      toast.error("No se pudo avisar al profesional, intentá de nuevo.");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
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
        <p className="font-semibold text-brand-dark truncate flex-1">{otherName}</p>
        {currentRole === "PROFESSIONAL" && (
          <button
            type="button"
            onClick={toggleBot}
            disabled={togglingBot}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shrink-0 disabled:opacity-50 ${
              botEnabled
                ? "border-brand-violet/30 bg-brand-violet/10 text-brand-violet"
                : "border-gray-200 bg-gray-50 text-brand-gray"
            }`}
          >
            {botEnabled ? <Bot size={14} /> : <BotOff size={14} />}
            {botEnabled ? "Asistente activo" : "Asistente apagado"}
          </button>
        )}
      </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-end gap-2 bg-brand-bg"
        onClick={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus();
        }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-brand-gray">Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-brand-gray">Todavía no hay mensajes. Escribí el primero.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            if (m.senderRole === "SYSTEM") {
              return (
                <div key={m.id} className="flex flex-col items-start">
                  <span className="flex items-center gap-1 text-[10px] text-brand-violet font-medium mb-0.5 ml-1">
                    <Bot size={11} /> Asistente de {otherName}
                  </span>
                  <div className="max-w-[75%] flex items-center gap-2 rounded-2xl bg-brand-green/10 border border-brand-green/20 px-3.5 py-2 text-sm font-medium text-brand-dark">
                    {m.body}
                    <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                  </div>
                </div>
              );
            }
            const mine = m.senderRole === currentRole;
            const isBot = m.senderRole === "BOT";
            const isFirstProfessionalMsg =
              m.senderRole === "PROFESSIONAL" && messages.slice(0, i).every((p) => p.senderRole !== "PROFESSIONAL");
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {isFirstProfessionalMsg && currentRole === "CLIENT" && (
                  <p className="w-full text-center text-[11px] text-brand-gray my-2">
                    {otherName} se unió a la conversación
                  </p>
                )}
                {isBot && (
                  <span className="flex items-center gap-1 text-[10px] text-brand-violet font-medium mb-0.5 ml-1">
                    <Bot size={11} /> Asistente de {otherName}
                  </span>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    isBot
                      ? "bg-brand-violet/10 border border-brand-violet/20 text-brand-dark"
                      : mine
                        ? "bg-brand-violet text-white"
                        : "bg-white border border-gray-200 text-brand-dark"
                  }`}
                >
                  {isBot ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 [&:not(:first-child)]:mt-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 [&:not(:first-child)]:mt-2">{children}</ol>,
                        li: ({ children }) => <li className="mt-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        a: ({ children, href }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.body}
                    </ReactMarkdown>
                  ) : (
                    m.body
                  )}
                </div>
              </div>
            );
          })
        )}
        {botTyping && (
          <div className="flex flex-col items-start">
            <span className="flex items-center gap-1 text-[10px] text-brand-violet font-medium mb-0.5 ml-1">
              <Bot size={11} /> Asistente de {otherName}
            </span>
            <div className="flex items-center gap-1 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-violet/60 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-violet/60 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-violet/60 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {currentRole === "CLIENT" && botEnabled && messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-white text-center">
          <button onClick={askForProfessional} className="text-xs font-medium text-brand-violet hover:underline">
            Hablar con el profesional
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <input
          ref={inputRef}
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
