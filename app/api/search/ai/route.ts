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

    const systemPrompt = `Traducís un pedido en lenguaje natural a los datos de búsqueda de una plataforma de servicios profesionales (Argentina).
No repitas literalmente las palabras del cliente: pensá qué profesión/rubro/servicio resuelve su necesidad.
Categorías disponibles (usá el slug exacto si aplica, si no aplica ninguna dejá null): ${categories.map((c) => `${c.name}=${c.slug}`).join(", ")}.
Respondé SOLO con JSON válido, sin texto extra, con esta forma exacta:
{"keywords": string[], "categoriaSlug": string | null, "zona": string | null, "precioMin": number | null, "precioMax": number | null}

"keywords": 2 a 5 términos, SIEMPRE de UNA sola palabra cada uno. El PRIMERO es el término único más probable de aparecer en el título del servicio de un profesional para este pedido (normalmente la profesión: "plomero", "masajista", "profesor"); el resto son alternativas/sinónimos. Nada de artículos ni verbos ("quiero", "necesito", "un", "de"). Nunca vacío.
Ejemplos:
- "quiero hacerme las uñas" -> ["manicura","manicurista","uñas","esmaltado","semipermanente"]
- "se me rompió la canilla" -> ["plomero","plomería","gasista","canilla","cañería"]
- "quiero aprender a tocar la guitarra" -> ["guitarra","profesor","clases","música"]
- "necesito quien me cuide a mi mamá mayor" -> ["cuidador","enfermería","acompañante","geriátrico"]

"zona": barrio, localidad, partido o zona que mencione el cliente. Extraela SIEMPRE que haya cualquier referencia geográfica, aunque sea informal ("por Caballito", "soy de Quilmes", "acá en zona norte"). Devolvela normalizada y sola: "Palermo", "La Plata", "Quilmes", "CABA", "Zona Norte". Sin preposiciones ("en", "por", "de"). Si no hay ninguna referencia geográfica, o dice cosas como "a domicilio"/"cerca mío" sin nombrar lugar, null.`;

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
