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

  async deleteById(id: string) {
    return this.repo.deleteById(id);
  }

  /**
   * Paginate advice list. Clamps invalid inputs and returns metadata.
   */
  async getPaginated(page: number, pageSize: number) {
    const all = await this.repo.findAll();
    const total = all.length;

    const size = Math.min(Math.max(1, pageSize), 20);
    const totalPages = Math.max(1, Math.ceil(total / size));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const start = (safePage - 1) * size;
    const items = all.slice(start, start + size);

    return {
      items,
      page: safePage,
      pageSize: size,
      total,
      totalPages,
      startIndex: start,
    };
  }
}
