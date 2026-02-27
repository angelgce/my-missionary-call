import { signToken } from '../lib/jwt';
import { AuthRepository } from './auth.repository';

export class AuthService {
  constructor(
    private repo: AuthRepository,
    private jwtSecret: string
  ) {}

  async login(email: string, password: string) {
    const admin = await this.repo.findAdminByEmail(email);
    if (!admin || admin.password !== password) {
      return null;
    }

    const token = await signToken({ sub: admin.id, email: admin.email }, this.jwtSecret);
    return { token, admin: { id: admin.id, email: admin.email } };
  }
}
