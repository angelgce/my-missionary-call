import { AdviceRepository } from './advice.repository';

export class AdviceService {
  constructor(private repo: AdviceRepository) {}

  async create(data: {
    userId: string;
    guestName: string;
    advice: string;
    sessionId: string;
    ipAddress?: string | null;
  }) {
    return this.repo.create(data);
  }

  async getAllPublic() {
    return this.repo.findAllPublic();
  }

  async getAll() {
    return this.repo.findAll();
  }

  async getAllAdmin() {
    return this.repo.findAllAdmin();
  }
}
