import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepo: UsersRepository) {}

  /**
   * Sync a Clerk user into the local database.
   * Called on every authenticated request to ensure the user record exists.
   * Uses Clerk's userId as the local primary key.
   */
  async syncUser(clerkUser: { sub: string; email: string; name: string }) {
    let user = await this.usersRepo.findById(clerkUser.sub);
    if (!user) {
      user = await this.usersRepo.createFromClerk({
        id: clerkUser.sub,
        email: clerkUser.email,
        name: clerkUser.name,
      });
    }
    return user;
  }

  async me(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
