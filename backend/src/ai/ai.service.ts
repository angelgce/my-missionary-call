const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const EXTRACTION_MODEL = '@cf/meta/llama-3.1-70b-instruct';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type MissionaryCallData = {
  missionaryName: string;
  missionName: string;
  language: string;
  trainingCenter: string;
  entryDate: string;
};

type MissionaryCallDataWithConfidence = MissionaryCallData & {
  confidence: {
    missionaryName: number;
    missionName: number;
    language: number;
    trainingCenter: number;
    entryDate: number;
  };
};

export class AIService {
  constructor(private ai: Ai) {}

  async chat(messages: Message[]) {
    const response = await this.ai.run(MODEL, { messages });
    return response;
  }

  async completion(prompt: string) {
    const response = await this.ai.run(MODEL, {
      messages: [{ role: 'user', content: prompt }],
    });
    return response;
  }

  async extractMissionaryCall(pdfText: string): Promise<MissionaryCallDataWithConfidence> {
    const prompt = `You are a data extraction assistant. Extract fields from this LDS missionary call letter. Return ONLY a valid JSON object, no extra text.

Rules:
- Return plain text values only, no formatting or line breaks.
- missionaryName: The missionary's name (e.g. "María García López"). Do NOT include "Hermana", "Elder", or titles. Just the name.
- missionName: The mission name WITHOUT the "Misión" prefix (e.g. if text says "Misión México Ciudad de México Chalco", return "México Ciudad de México Chalco").
- language: The language they will speak. If not explicitly stated, infer from the mission country.
- trainingCenter: The MTC/CCM location if mentioned. Empty string if not found.
- entryDate: The MTC report date if mentioned. Empty string if not found.
- confidence: Object with same keys, each a number 0-100. Use 0 if not found.

If a field cannot be found or inferred, use empty string and confidence 0.

Text:
${pdfText}

JSON:`;

    const response = (await this.ai.run(EXTRACTION_MODEL, {
      messages: [{ role: 'user', content: prompt }],
    })) as { response?: string };

    const responseText = response.response || '';

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as MissionaryCallDataWithConfidence;

    const defaultConfidence = {
      missionaryName: 0,
      missionName: 0,
      language: 0,
      trainingCenter: 0,
      entryDate: 0,
    };

    return {
      missionaryName: parsed.missionaryName || '',
      missionName: parsed.missionName || '',
      language: parsed.language || '',
      trainingCenter: parsed.trainingCenter || '',
      entryDate: parsed.entryDate || '',
      confidence: parsed.confidence
        ? {
            missionaryName: Number(parsed.confidence.missionaryName) || 0,
            missionName: Number(parsed.confidence.missionName) || 0,
            language: Number(parsed.confidence.language) || 0,
            trainingCenter: Number(parsed.confidence.trainingCenter) || 0,
            entryDate: Number(parsed.confidence.entryDate) || 0,
          }
        : defaultConfidence,
    };
  }

  normalizeMissionaryCallLetter(
    pdfText: string,
    fields: MissionaryCallData,
  ): string {
    // Detect gender from original text
    const isElder = /\b[EÉ]lder\b/i.test(pdfText) || /\bEstimado\b/i.test(pdfText);

    // Extract address block from original PDF
    // Address is typically between the date line and "Estimad(a|o)"
    const addressMatch = pdfText.match(
      /^(.*?\d{4})\s*\n([\s\S]*?)(?=Estimad[ao])/im,
    );

    let letterDate = '';
    let addressBlock = '';

    if (addressMatch) {
      letterDate = addressMatch[1].trim();
      // Clean up address: remove the missionary title line and reconstruct
      const rawAddress = addressMatch[2].trim();
      const addressLines = rawAddress
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      addressBlock = addressLines.join('\n');
    }

    // Extract weekday from original text for the entry date
    const weekdayMatch = pdfText.match(
      /(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+\d{1,2}\s+de/i,
    );
    const entryDateWithWeekday = weekdayMatch
      ? weekdayMatch[0].replace(/\s+de$/, '') // e.g. "lunes 9"
      : '';

    // Build the entry date string for the template
    // If we found a weekday, include it: "el lunes 9 de marzo de 2026"
    // Otherwise just use the field value: "el 9 de marzo de 2026"
    let formattedEntryDate = fields.entryDate;
    if (entryDateWithWeekday && !fields.entryDate.match(/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i)) {
      // Extract weekday only
      const weekday = entryDateWithWeekday.match(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i)?.[1] || '';
      if (weekday) {
        formattedEntryDate = `${weekday} ${fields.entryDate}`;
      }
    }

    // Gender-specific terms
    const salutation = isElder ? `Estimado Élder` : `Estimada Hermana`;
    const misionero = isElder ? 'misionero' : 'misionera';
    const representanta = isElder ? 'representante' : 'representante';
    const bendecido = isElder ? 'bendecido' : 'bendecida';

    // Extract extra paragraphs from original that aren't in the standard template
    // Look for paragraphs after the mission assignment and before "Atentamente"
    const extraParagraphs: string[] = [];

    // Check for "Al prestar servicio con todo su corazón..." paragraph
    const heartMatch = pdfText.match(/Al prestar servicio con todo su corazón[\s\S]*?(?=\n\n|\nTenga|\nSe anticipa)/i);
    if (heartMatch) {
      extraParagraphs.push(heartMatch[0].replace(/\s+/g, ' ').trim());
    }

    // Check for "Tenga a bien revisar el Portal Misional..." paragraph
    const portalMatch = pdfText.match(/Tenga a bien revisar el Portal Misional[\s\S]*?(?=\n\n|\nSe anticipa|\nNuestro)/i);
    if (portalMatch) {
      extraParagraphs.push(portalMatch[0].replace(/\s+/g, ' ').trim());
    }

    // Check for "Se anticipa que prestará servicio..." paragraph
    const serviceMatch = pdfText.match(/Se anticipa que prestará servicio[\s\S]*?(?=\n\n|\nNuestro|\nPonemos)/i);
    if (serviceMatch) {
      extraParagraphs.push(serviceMatch[0].replace(/\s+/g, ' ').trim());
    }

    // Check for "Nuestro Padre Celestial la/lo recompensará..." paragraph (different from the prayers one)
    const rewardMatch = pdfText.match(/Nuestro Padre Celestial l[ao] recompensará[\s\S]*?(?=\n\n|\nPonemos|\nNuestro Padre Celestial ha)/i);
    if (rewardMatch) {
      extraParagraphs.push(rewardMatch[0].replace(/\s+/g, ' ').trim());
    }

    // Check for "Ponemos nuestra confianza..." paragraph
    const trustMatch = pdfText.match(/Ponemos nuestra confianza[\s\S]*?(?=\n\n|\nAtentamente|$)/i);
    if (trustMatch) {
      extraParagraphs.push(trustMatch[0].replace(/\s+/g, ' ').trim());
    }

    const extraBlock = extraParagraphs.length > 0
      ? '\n\n' + extraParagraphs.join('\n\n')
      : '';

    // Build the normalized letter
    const letter = `${letterDate}

${addressBlock}

${salutation} ${fields.missionaryName}:

Por medio de la presente, se le llama a prestar servicio como ${misionero} de La Iglesia de Jesucristo de los Santos de los Últimos Días. Usted ha sido asignada a la Misión ${fields.missionName} y se preparará para predicar el Evangelio en el idioma ${fields.language}.

Se le ha recomendado como una persona digna de representar al Señor en calidad de ministro del evangelio restaurado de Jesucristo. Será una ${representanta} oficial de la Iglesia. Como tal, se espera que usted honre los convenios que ha hecho con el Padre Celestial, guarde los mandamientos, mantenga las más altas normas de conducta y siga el consejo recto de su presidente de misión.

Al dedicar su tiempo y su atención a servir al Señor, dejando a un lado todos los demás asuntos personales, usted será ${bendecido} con un mayor conocimiento y testimonio de Jesucristo y de Su evangelio restaurado.

Su objetivo será invitar a los demás a venir a Cristo ayudándoles a que reciban el evangelio restaurado mediante la fe en Jesucristo y Su expiación, el arrepentimiento, el bautismo, el don del Espíritu Santo y perseverar hasta el fin.

Deberá presentarse el ${formattedEntryDate}.${extraBlock}

Nuestro Padre Celestial ha escuchado las oraciones de usted y de sus seres queridos. Le rogamos que siga buscando guía mediante la oración mientras se prepara para prestar servicio.

Atentamente,

Presidente Russell M. Nelson`;

    return letter;
  }

  async moderateAdvice(text: string): Promise<{ approved: boolean; reason: string }> {
    const prompt = `You are a content moderator for a family-friendly LDS missionary event website. Analyze the following message and determine if it should be approved or rejected.

Reject if the message contains:
- Profanity, vulgar language, or insults (in any language, including Spanish)
- Spam, advertisements, or irrelevant content
- Hate speech, discrimination, or offensive content
- Inappropriate sexual content
- Gibberish or nonsensical text (random characters, keyboard smashing)

Approve if:
- It's a genuine, kind, or supportive message/advice
- It's written in any language but is respectful

Return ONLY a valid JSON object with keys "approved" (boolean) and "reason" (string, brief explanation in Spanish). No extra text.

Message to analyze:
"${text.replace(/"/g, '\\"')}"

JSON:`;

    const response = (await this.ai.run(MODEL, {
      messages: [{ role: 'user', content: prompt }],
    })) as { response?: string };

    const responseText = response.response || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { approved: true, reason: '' };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        approved: Boolean(parsed.approved),
        reason: String(parsed.reason || ''),
      };
    } catch {
      return { approved: true, reason: '' };
    }
  }

  async geocodeMission(
    missionName: string,
    missionsListContext?: string,
  ): Promise<{ lat: number; lng: number }> {
    const contextBlock = missionsListContext
      ? `\nHere is a reference list of all known LDS missions and their headquarters cities for context:\n${missionsListContext}\n`
      : '';

    const prompt = `Given the following LDS mission name, return the approximate latitude and longitude of the main city in that mission area. Return ONLY a valid JSON object with keys "lat" and "lng" as numbers, no extra text.
${contextBlock}
Mission name: ${missionName}

JSON:`;

    const response = (await this.ai.run(EXTRACTION_MODEL, {
      messages: [{ role: 'user', content: prompt }],
    })) as { response?: string };

    const responseText = response.response || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid coordinates JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') {
      throw new Error('Invalid coordinate values');
    }

    return { lat: parsed.lat, lng: parsed.lng };
  }
}
