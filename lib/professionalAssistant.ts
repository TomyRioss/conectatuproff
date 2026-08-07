import { prisma } from "@/lib/prisma";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ESCALATE_MARKER = "[ESCALATE]";
const FALLBACK_TEXT = "No pude procesar tu consulta, probá de nuevo.";

async function buildSystemPrompt(professionalId: string) {
  const pro = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      firstName: true,
      lastName: true,
      specialty: true,
      bio: true,
      location: true,
      modality: true,
      services: {
        where: { status: "ACTIVE" },
        select: { title: true, description: true, price: true, currency: true, durationMin: true },
      },
      availability: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });

  if (!pro) return null;

  const servicesText = pro.services.length
    ? pro.services
        .map(
          (s) =>
            `- ${s.title}${s.price ? ` ($${s.price} ${s.currency})` : ""}${s.durationMin ? ` — ${s.durationMin} min` : ""}${s.description ? `\n  ${s.description}` : ""}`
        )
        .join("\n")
    : "No cargó servicios todavía.";

  const availabilityText = pro.availability.length
    ? pro.availability.map((a) => `- ${DAY_NAMES[a.dayOfWeek]}: ${a.startTime} a ${a.endTime}`).join("\n")
    : "No cargó horarios generales todavía.";

  const fullName = `${pro.firstName} ${pro.lastName}`;

  return `Sos el asistente virtual de ${fullName}, un profesional en la plataforma Conecta Tu Proff. Estás hablando con un cliente potencial dentro del chat de ${fullName}.

Datos de ${fullName}:
- Especialidad: ${pro.specialty ?? "no especificada"}
- Zona: ${pro.location ?? "no especificada"}
- Modalidad: ${pro.modality}
- Bio: ${pro.bio ?? "sin bio"}

Servicios:
${servicesText}

Disponibilidad general:
${availabilityText}

Reglas:
- Respondé SOLO al último mensaje del cliente. No repitas una respuesta anterior solo porque el tema ya salió antes en la charla.
- Un saludo suelto ("hola", "buenas", "hola de nuevo", etc.) se responde SIEMPRE con un saludo corto y una pregunta de qué necesita, nunca con la lista de servicios, sin importar de qué se haya hablado antes.
- Respondé en español (Argentina), corto y claro, sin relleno.
- Usá SOLO los datos de arriba. Nunca inventes precios, horarios o servicios que no estén listados.
- Si preguntan por un servicio específico (qué incluye, en qué consiste, etc.), respondé con su descripción puntual. No repitas la lista completa de servicios salvo que te pregunten "qué servicios ofrece" o similar.
- No sos ${fullName}, sos su asistente. Dejalo claro si preguntan.
- Si el cliente pide explícitamente hablar con ${fullName} directamente, o hace un reclamo, o pide algo que no podés resolver con estos datos, terminá tu respuesta con la marca exacta "${ESCALATE_MARKER}" (en su propia línea, al final, no la menciones ni expliques que existe).
- Regla obligatoria: si tu respuesta le dice al cliente que le vas a avisar, notificar, pasar el mensaje o consultarle algo a ${fullName} (ej. "le aviso a ${fullName}", "lo contacto", "le paso tu consulta"), SIEMPRE agregá la marca "${ESCALATE_MARKER}" al final. Nunca prometas avisarle a ${fullName} sin agregar la marca — si no vas a avisarle de verdad, no lo digas.`;
}

export async function getBotReply(conversationId: string, professionalId: string): Promise<{ text: string; escalate: boolean } | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = await buildSystemPrompt(professionalId);
  if (!systemPrompt) return null;

  const recentHistory = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { senderRole: true, body: true },
  });
  const history = recentHistory.reverse().filter((m) => m.body !== FALLBACK_TEXT);

  const messages = history.map((m) => ({
    role: m.senderRole === "CLIENT" ? ("user" as const) : ("assistant" as const),
    content: m.body,
  }));

  async function callOnce() {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.4,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error("[getBotReply] DeepSeek error", await response.text());
      return null;
    }

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    if (!raw.trim()) {
      console.error("[getBotReply] empty content, finish_reason:", data.choices?.[0]?.finish_reason);
      return null;
    }
    const escalate = raw.includes(ESCALATE_MARKER);
    const text = raw.replace(ESCALATE_MARKER, "").trim();
    return { text, escalate };
  }

  try {
    return (await callOnce()) ?? (await callOnce()) ?? { text: FALLBACK_TEXT, escalate: false };
  } catch (err) {
    console.error("[getBotReply]", err);
    return null;
  }
}
