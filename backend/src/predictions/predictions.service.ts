import { PredictionsRepository } from './predictions.repository';

export class PredictionsService {
  constructor(private repo: PredictionsRepository) {}

  async createOrUpdate(data: {
    userId: string;
    guestName: string;
    country: string;
    countryCode: string;
    state: string;
    stateCode: string;
    city: string;
    sessionId: string;
    latitude?: string | null;
    longitude?: string | null;
    ipAddress?: string | null;
  }): Promise<{ prediction: unknown; created: boolean }> {
    const existing = await this.repo.findBySessionId(data.sessionId);

    if (existing) {
      const updated = await this.repo.updateBySessionId(data.sessionId, {
        guestName: data.guestName,
        country: data.country,
        countryCode: data.countryCode,
        state: data.state,
        stateCode: data.stateCode,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        ipAddress: data.ipAddress,
      });
      return { prediction: updated, created: false };
    }

    const created = await this.repo.create(data);
    return { prediction: created, created: true };
  }

  async getBySessionId(sessionId: string) {
    return this.repo.findBySessionId(sessionId);
  }

  async getAll() {
    return this.repo.findAll();
  }

  async getAllAdmin() {
    return this.repo.findAllAdmin();
  }

  async deleteById(id: string) {
    return this.repo.deleteById(id);
  }
}
