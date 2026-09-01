import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const MAX_TEXT_LENGTH = 500;

export async function POST(req: NextRequest) {
  const rl = rateLimit(`search-ai:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const body = await req.json().catch(() => null);
    const text = body?.text;
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
    const trimmed = text.slice(0, MAX_TEXT_LENGTH);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const categories = await prisma.category.findMany({ select: { name: true, slug: true } });

    const systemPrompt = `Traducís un pedido en lenguaje natural al tipo de profesional o servicio que lo resuelve, para una plataforma de servicios profesionales (Argentina).
No repitas literalmente las palabras del cliente: pensá qué profesión/rubro/servicio resuelve su necesidad.
Ejemplos: "quiero hacerme las uñas" -> manicurista, manicura, uñas. "se me rompió la canilla" -> plomero, plomería, gasista. "quiero aprender a tocar la guitarra" -> profesor de guitarra, clases de música, guitarra.
Categorías disponibles (usá el slug exacto si aplica, si no aplica ninguna dejá null): ${categories.map((c) => `${c.name}=${c.slug}`).join(", ")}.
Respondé SOLO con JSON válido, sin texto extra, con esta forma exacta:
{"keywords": string[], "categoriaSlug": string | null, "zona": string | null, "precioMin": number | null, "precioMax": number | null}
"keywords" son 2 a 5 términos cortos (profesión, rubro, servicio, sinónimos) que un profesional pondría en el título de su servicio para este pedido. Nunca vacío.
"zona" es el barrio, localidad o zona (CABA/GBA) que haya mencionado el cliente, tal cual la nombró. Si no mencionó ninguna zona, null.`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmed },
        ],
        temperature: 0.2,
        max_tokens: 5000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI search upstream error:", response.status, errorText.slice(0, 500));
      return NextResponse.json({ error: "La búsqueda IA no está disponible en este momento." }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: unknown): k is string => typeof k === "string" && k.trim().length > 0)
      : [];

    return NextResponse.json({
      keywords: keywords.length > 0 ? keywords : [trimmed],
      categoriaSlug: typeof parsed.categoriaSlug === "string" ? parsed.categoriaSlug : null,
      zona: typeof parsed.zona === "string" && parsed.zona.trim() ? parsed.zona.trim() : null,
      precioMin: typeof parsed.precioMin === "number" ? parsed.precioMin : null,
      precioMax: typeof parsed.precioMax === "number" ? parsed.precioMax : null,
    });
  } catch (err) {
    console.error("AI search API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
