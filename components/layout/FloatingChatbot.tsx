"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, User, Minimize2, Headset } from "lucide-react";
import ReactMarkdown from "react-markdown";

// El chatbot general de orientación (Mora) debe estar disponible para el
// cliente logueado también dentro del dashboard: solo se oculta en back-office
// (admin/owner) y flujos de registro/login.
const PRIVATE_PREFIXES = ["/admin", "/owner", "/login", "/register", "/onboarding"];

type Msg = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MSG: Msg = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de Conecta Tu Proff. ¿En qué puedo ayudarte?",
};

const SUGGESTED_QUESTIONS = [
  "¿Cómo encuentro un profesional?",
  "¿Cómo reservo un turno?",
  "¿Cómo funciona Conecta Tu Proff?",
];

function MoraAvatar({ size, className }: { size: number; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/mora-avatar.jpg" alt="Mora" width={size} height={size} className={className} />;
}

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (suggestion?: string) => {
    const text = (suggestion ?? input).trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const reply: string =
        data.reply ?? "Ups, algo salió mal. Probá de nuevo en un momento.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No pude conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (PRIVATE_PREFIXES.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-brand-espresso text-white shadow-lg flex items-center justify-center hover:bg-brand-mauve transition-colors"
        aria-label="Mostrar asistente"
      >
        <MessageCircle size={22} />
      </button>
    );
  }

  // pointer-events-none en el contenedor: es fijo y full-width, y sin esto bloquea
  // los clics de dropdowns/modales que quedan debajo (el z-50 del dropdown del
  // hero vive en el stacking context z-10 del hero, por debajo de este z-40).
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5">
      {isOpen && (
        <div className="pointer-events-auto w-full sm:w-[480px] h-[70dvh] min-h-[380px] max-h-[70vh] sm:h-[520px] bg-white rounded-2xl shadow-2xl border border-brand-cream flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-espresso text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                <MoraAvatar size={32} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium">Mora</p>
                <p className="text-[10px] text-white/70">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Minimizar"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setHidden(true)}
                className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Ocultar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 bg-brand-bg"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${
                    m.role === "user" ? "bg-brand-rose text-white" : ""
                  }`}
                >
                  {m.role === "user" ? (
                    <User size={14} />
                  ) : (
                    <MoraAvatar size={28} className="h-full w-full object-cover" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] sm:max-w-[80%] text-sm px-3 py-2 rounded-xl ${
                    m.role === "user"
                      ? "bg-brand-rose text-white rounded-tr-none"
                      : "bg-white text-brand-dark border border-brand-cream rounded-tl-none"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-brand-espresso">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 last:mb-0">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 last:mb-0">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5 last:mb-0">{children}</li>,
                        a: ({ children, href }) => (
                          <a href={href} className="text-brand-violet underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {messages.length === 1 && !loading && (
              <div className="pl-9 pt-1">
                <p className="mb-2 text-xs text-brand-gray">Preguntas recomendadas</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="rounded-full border border-brand-cream bg-white px-3 py-2 text-left text-xs text-brand-espresso transition-colors hover:border-brand-rose hover:bg-brand-rose/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose/50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loading && (
              <div className="flex gap-2 flex-row">
                <div className="h-7 w-7 rounded-full shrink-0 overflow-hidden flex items-center justify-center">
                  <MoraAvatar size={28} className="h-full w-full object-cover" />
                </div>
                <div className="bg-white border border-brand-cream rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-gray rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-brand-gray rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-brand-gray rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-brand-cream shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu consulta..."
                className="flex-1 bg-brand-bg text-brand-dark placeholder:text-brand-gray text-[16px] sm:text-sm rounded-full px-4 py-3 sm:py-2.5 outline-none focus:ring-2 focus:ring-brand-rose/30"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="h-11 w-11 sm:h-9 sm:w-9 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                aria-label="Enviar"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto h-14 pl-4 pr-5 rounded-full bg-brand-espresso text-white shadow-xl flex items-center gap-2 hover:bg-brand-mauve transition-all hover:scale-105"
          aria-label="Abrir asistente"
        >
          <Headset size={22} />
          <span className="font-medium text-sm">Ayuda</span>
        </button>
      )}
    </div>
  );
}
