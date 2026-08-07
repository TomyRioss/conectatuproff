import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
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
        model: "deepseek-v4-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "DeepSeek API error", details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "No pude obtener una respuesta.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chatbot API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
