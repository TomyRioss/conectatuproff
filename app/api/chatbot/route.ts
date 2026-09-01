import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `Sos el asistente virtual de Conecta Tu Proff, una plataforma argentina que conecta profesionales con clientes.

Reglas estrictas:
- Respondé siempre en español (Argentina), con palabras simples. NUNCA uses rutas técnicas como "/register" o "/login". En vez de eso, decí "la página de registro", "la página para entrar", o "la página principal".
- Sé ULTRA conciso: dá la info esencial en pocas palabras, sin relleno.
- Hablá como si le explicaras a una persona mayor o alguien que nunca usó una computadora: cero jerga técnica.
- Si necesitás organizar, usá bullets ("-") cortos, nunca párrafos largos ni listas extensas.
- Sé amable, cálido y directo.
- No inventes datos de profesionales.
- Si te preguntan algo fuera de tu alcance, redirigilos a soporte por WhatsApp al +54 9 11 5904-7067.
- Las rutas principales son: / (inicio), /login, /register, /perfil/profesional/[usuario], /favoritos
`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const rl = rateLimit(`chatbot:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const body = await req.json().catch(() => null);
    const rawMessages = body?.messages;

    if (!Array.isArray(rawMessages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Solo aceptamos user/assistant con contenido acotado: evita jailbreak por
    // role:"system" inyectado y cuerpos gigantes que encarecen el upstream.
    const messages = rawMessages
      .slice(-MAX_MESSAGES)
      .filter(
        (m: unknown): m is { role: "user" | "assistant"; content: string } =>
          typeof m === "object" &&
          m !== null &&
          "role" in m &&
          "content" in m &&
          ((m as { role?: string }).role === "user" || (m as { role?: string }).role === "assistant") &&
          typeof (m as { content?: unknown }).content === "string"
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

    if (messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Chatbot upstream error:", response.status, errorText.slice(0, 500));
      return NextResponse.json({ error: "El asistente no está disponible en este momento." }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "No pude obtener una respuesta.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chatbot API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
