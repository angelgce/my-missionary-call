import { RevelationRepository } from './revelation.repository';
import { encryptRevelation, decryptRevelation, encrypt, decrypt } from '../lib/encryption';
import { AIService } from '../ai/ai.service';
import { MISSIONS_LIST } from '../assets/missions-list';

export class RevelationService {
  constructor(
    private repo: RevelationRepository,
    private encryptionKey: string,
  ) {}

  async get(isAdmin = false) {
    const rev = await this.repo.findFirst();
    if (!rev) return null;

    const decrypted = await decryptRevelation(
      {
        missionaryName: rev.missionaryName,
        missionaryAddress: rev.missionaryAddress,
        missionName: rev.missionName,
        language: rev.language,
        trainingCenter: rev.trainingCenter,
        entryDate: rev.entryDate,
      },
      this.encryptionKey,
    );

    const masked = {
      id: rev.id,
      isRevealed: rev.isRevealed,
      missionaryName: decrypted.missionaryName,
      missionaryAddress: '???',
      missionName: '???',
      language: '???',
      trainingCenter: '???',
      entryDate: '???',
      pdfText: null,
      openingDate: rev.openingDate,
      locationAddress: rev.locationAddress,
      locationUrl: rev.locationUrl,
      createdAt: rev.createdAt,
      updatedAt: rev.updatedAt,
    };

    if (!rev.isRevealed) {
      return { ...masked, isRevealed: false };
    }

    // Revealed but check if date has passed (Villahermosa UTC-6)
    const isFreeForAll = this.isOpeningDateExpired(rev.openingDate);

    if (!isFreeForAll && !isAdmin) {
      return masked;
    }

    // Admin or date expired — return full data
    let pdfText: string | null = null;
    if (rev.pdfText) {
      pdfText = await decrypt(rev.pdfText, this.encryptionKey);
    }

    let normalizedPdfText: string | null = null;
    if (rev.normalizedPdfText) {
      normalizedPdfText = await decrypt(rev.normalizedPdfText, this.encryptionKey);
    }

    return {
      ...rev,
      ...decrypted,
      pdfText,
      normalizedPdfText,
    };
  }

  private isOpeningDateExpired(openingDate: string | null): boolean {
    if (!openingDate) return true;
    // openingDate is stored as a local date string (Villahermosa UTC-6 = offset 360 min)
    const VILLAHERMOSA_OFFSET_MS = 6 * 60 * 60_000;
    const target = new Date(openingDate);
    const targetUtc = target.getTime() + VILLAHERMOSA_OFFSET_MS;
    return Date.now() >= targetUtc;
  }

  async getAdmin() {
    const rev = await this.repo.findFirst();
    if (!rev) return null;

    const decrypted = await decryptRevelation(
      {
        missionaryName: rev.missionaryName,
        missionaryAddress: rev.missionaryAddress,
        missionName: rev.missionName,
        language: rev.language,
        trainingCenter: rev.trainingCenter,
        entryDate: rev.entryDate,
      },
      this.encryptionKey,
    );

    return {
      id: rev.id,
      isRevealed: rev.isRevealed,
      missionaryName: decrypted.missionaryName,
      missionaryAddress: '••••••••',
      missionName: '••••••••',
      language: '••••••••',
      trainingCenter: '••••••••',
      entryDate: '••••••••',
      hasData: true,
      openingDate: rev.openingDate,
      locationAddress: rev.locationAddress,
      locationUrl: rev.locationUrl,
      createdAt: rev.createdAt,
      updatedAt: rev.updatedAt,
    };
  }

  async updateFromPdf(data: {
    missionaryName: string;
    missionaryAddress: string;
    missionName: string;
    language: string;
    trainingCenter: string;
    entryDate: string;
    pdfText: string;
    normalizedPdfText?: string;
  }) {
    const encrypted = await encryptRevelation(
      {
        missionaryName: data.missionaryName,
        missionaryAddress: data.missionaryAddress,
        missionName: data.missionName,
        language: data.language,
        trainingCenter: data.trainingCenter,
        entryDate: data.entryDate,
      },
      this.encryptionKey,
    );
    const encryptedPdfText = await encrypt(data.pdfText, this.encryptionKey);
    const encryptedNormalizedPdfText = data.normalizedPdfText
      ? await encrypt(data.normalizedPdfText, this.encryptionKey)
      : '';
    return this.repo.upsert({ ...encrypted, pdfText: encryptedPdfText, normalizedPdfText: encryptedNormalizedPdfText });
  }

  async update(data: {
    missionaryName: string;
    missionaryAddress: string;
    missionName: string;
    language: string;
    trainingCenter: string;
    entryDate: string;
  }) {
    const encrypted = await encryptRevelation(data, this.encryptionKey);
    return this.repo.upsert(encrypted);
  }

  async updateMissionaryName(name: string) {
    const encrypted = await encrypt(name, this.encryptionKey);
    return this.repo.updateMissionaryName(encrypted);
  }

  async getEventSettings() {
    const rev = await this.repo.findFirst();
    if (!rev) return null;

    return {
      openingDate: rev.openingDate,
      locationAddress: rev.locationAddress,
      locationUrl: rev.locationUrl,
    };
  }

  async updateEventSettings(data: {
    openingDate: string;
    locationAddress: string;
    locationUrl: string;
  }) {
    return this.repo.updateEventSettings(data);
  }

  async toggleReveal(): Promise<{ error: string } | Record<string, unknown> | null> {
    const rev = await this.repo.findFirst();
    if (!rev) return null;

    // Turning ON reveal — only allowed if countdown has expired
    if (!rev.isRevealed) {
      if (!this.isOpeningDateExpired(rev.openingDate)) {
        return { error: 'No puedes revelar antes de que termine el contador.' };
      }
    }

    return this.repo.toggleReveal();
  }

  async getDestinationCoordinates(
    ai: Ai,
    kv: KVNamespace,
    isAdmin = false,
  ): Promise<{ lat: number; lng: number; missionName: string } | null> {
    const rev = await this.repo.findFirst();
    if (!rev || !rev.isRevealed) return null;

    const isFreeForAll = this.isOpeningDateExpired(rev.openingDate);
    if (!isFreeForAll && !isAdmin) return null;

    // Check KV cache first
    const cached = (await kv.get('revelation:destination', 'json')) as {
      lat: number;
      lng: number;
      missionName: string;
    } | null;
    if (cached) return cached;

    // Decrypt mission name
    const decrypted = await decryptRevelation(
      {
        missionaryName: rev.missionaryName,
        missionaryAddress: rev.missionaryAddress,
        missionName: rev.missionName,
        language: rev.language,
        trainingCenter: rev.trainingCenter,
        entryDate: rev.entryDate,
      },
      this.encryptionKey,
    );

    // Get coordinates from AI
    const aiService = new AIService(ai);
    const coords = await aiService.geocodeMission(decrypted.missionName, MISSIONS_LIST);

    const result = { ...coords, missionName: decrypted.missionName };

    // Cache in KV for 24 hours
    await kv.put('revelation:destination', JSON.stringify(result), { expirationTtl: 86400 });

    return result;
  }
}
