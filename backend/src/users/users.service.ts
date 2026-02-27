import { UsersRepository } from './users.repository';

export class UsersService {
  constructor(private repo: UsersRepository) {}

  async getOrCreateUser(name: string, ipAddress: string, email?: string) {
    if (ipAddress !== 'unknown') {
      const existing = await this.repo.findByIp(ipAddress);
      if (existing) {
        return existing;
      }
    }

    return this.repo.create({ name, email, ipAddress });
  }
}
