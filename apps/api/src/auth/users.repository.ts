import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createFromClerk(data: {
    id: string;
    email: string;
    name: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: data.id },
      update: { email: data.email, name: data.name },
      create: { id: data.id, email: data.email, name: data.name },
    });
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'avatarUrl' | 'elevenLabsVoiceId' | 'heyGenAvatarId'>>,
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
