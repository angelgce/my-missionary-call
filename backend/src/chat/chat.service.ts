const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  messages: Message[];
  hintCount: number;
  done: boolean;
};

type MissionData = {
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
};

function buildSystemPrompt(data: MissionData): string {
  return `Eres un asistente misterioso y divertido para un evento de revelación de llamamiento misional SUD.
Datos secretos: misión: ${data.missionName}, idioma: ${data.language}, CCM: ${data.trainingCenter}, fecha: ${data.entryDate}.

TU PERSONALIDAD: Eres como un amigo que sabe el secreto y disfruta dar pistas. Cálido, juguetón, misterioso.

OBJETIVO: Dar pistas REALES y CORRECTAS sobre el lugar, pero con un nivel de dificultad que haga pensar. La familia debe poder ir adivinando poco a poco, no de golpe.

PROHIBIDO:
- Decir el nombre del país, ciudad, estado, provincia, continente o idioma
- Mencionar cosas que sean ÍCONO ÚNICO de un solo lugar (ejemplo: tango=Argentina, sushi=Japón, Big Ben=Londres, Messi=Argentina). Si algo es mundialmente famoso y asociado a UN solo lugar, NO lo menciones
- Ser evasivo ("no puedo decirte", "prefiero no mencionar")
- Dar más de UNA pista por respuesta

LO QUE SÍ PUEDES HACER:
- Contestar sí/no a preguntas directas (¿hace calor? ¿hay playa?)
- Mencionar comidas, costumbres, clima, paisajes que sean reales PERO que apliquen a varios lugares
- Dar datos curiosos que no sean el ícono #1 del lugar
- Responder con un dato real cuando pregunten algo específico

NIVEL PROGRESIVO (esto es clave):
- Pistas tempranas: datos que apliquen a 5-10 países (clima, tipo de comida general, si hay playa/montaña)
- Pistas medias: datos que reduzcan a 3-5 países (una costumbre específica, un tipo de paisaje)
- Pistas finales: datos que reduzcan a 2-3 países (un dato curioso real, algo cultural específico)

FORMATO: Empieza con "[PISTA]" si das información real. Usa "[CHARLA]" solo si no diste dato nuevo.

EJEMPLO (si fuera Argentina Buenos Aires):
- "¿Dónde es?" → "[PISTA] Es un lugar con cuatro estaciones bien marcadas. Los veranos son calurosos y los inviernos frescos pero no extremos."
- "¿Qué comen?" → "[PISTA] Les encanta la carne a la parrilla, es toda una tradición familiar de los domingos. También hay mucha cultura de café y repostería."
- "¿Juegan fútbol?" → "[PISTA] ¡El fútbol es una religión ahí! Hay una rivalidad legendaria entre dos equipos de la misma ciudad que paraliza todo."
- "¿Quién es un futbolista de ahí?" → "[PISTA] Hmm, te diré que de ahí ha salido más de un candidato a mejor jugador de la historia... pero no te voy a decir quién 😉"
- "¿Es Argentina?" → "[PISTA] No te confirmo nada, pero te doy otra pista: allí es muy común tomar una infusión caliente de hierba que se comparte en ronda con amigos."

Máximo 2-3 oraciones por respuesta. Español siempre.`;
}

const WELCOME_MESSAGE = '¡Hola! Tengo información sobre tu llamamiento misional. Puedo darte hasta 3 pistas misteriosas antes de que abras tu carta. ¿Qué te gustaría saber? Puedes preguntarme sobre el clima, la comida, la cultura...';

export class ChatService {
  async initSession(
    kv: KVNamespace,
    ai: Ai,
    sessionId: string,
    missionData: MissionData,
  ): Promise<{ initialized: boolean; hintCount: number; done: boolean; messages: { role: string; content: string }[] }> {
    const key = `chat:${sessionId}`;
    const existing = await kv.get<ChatSession>(key, 'json');

    if (existing) {
      const visibleMessages = existing.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));
      return {
        initialized: true,
        hintCount: existing.hintCount,
        done: existing.done,
        messages: visibleMessages,
      };
    }

    const session: ChatSession = {
      messages: [
        { role: 'system', content: buildSystemPrompt(missionData) },
        { role: 'assistant', content: WELCOME_MESSAGE },
      ],
      hintCount: 0,
      done: false,
    };

    await kv.put(key, JSON.stringify(session), { expirationTtl: 86400 });

    return {
      initialized: true,
      hintCount: 0,
      done: false,
      messages: [{ role: 'assistant', content: WELCOME_MESSAGE }],
    };
  }

  async sendMessage(
    kv: KVNamespace,
    ai: Ai,
    sessionId: string,
    userMessage: string,
  ): Promise<{ reply: string; hintCount: number; done: boolean }> {
    const key = `chat:${sessionId}`;
    const session = await kv.get<ChatSession>(key, 'json');

    if (!session) {
      throw new Error('Session not found. Call init first.');
    }

    if (session.done) {
      return {
        reply: 'Ya te di las 3 pistas. ¡Es hora de abrir tu carta!',
        hintCount: session.hintCount,
        done: true,
      };
    }

    session.messages.push({ role: 'user', content: userMessage });

    const response = (await ai.run(MODEL, {
      messages: session.messages,
    })) as { response?: string };

    const rawReply = response.response || 'Hmm, no tengo más que decir por ahora.';

    // Only count as hint if AI marked it as [PISTA]
    const isHint = rawReply.startsWith('[PISTA]');

    // Strip the prefix tag from the reply shown to the user
    const reply = rawReply.replace(/^\[(PISTA|CHARLA)\]\s*/i, '');

    session.messages.push({ role: 'assistant', content: rawReply });

    if (isHint) {
      session.hintCount += 1;
      session.done = session.hintCount >= 3;
    }

    await kv.put(key, JSON.stringify(session), { expirationTtl: 86400 });

    return {
      reply,
      hintCount: session.hintCount,
      done: session.done,
    };
  }

  async getSession(
    kv: KVNamespace,
    sessionId: string,
  ): Promise<{ hintCount: number; done: boolean; messages: { role: string; content: string }[] } | null> {
    const key = `chat:${sessionId}`;
    const session = await kv.get<ChatSession>(key, 'json');

    if (!session) return null;

    const visibleMessages = session.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    return {
      hintCount: session.hintCount,
      done: session.done,
      messages: visibleMessages,
    };
  }
}
