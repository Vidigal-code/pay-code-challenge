import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import {
  CreateUserInput,
  UpdateUserInput,
  USER_REPOSITORY,
  UserRepository,
} from "@domain/repositories/user.repository";
import { User } from "@domain/entities/user.entity";
import { Email } from "@domain/value-objects/email.vo";

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });
    return this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return user ? this.toDomain(user) : null;
  }

  async update(data: UpdateUserInput): Promise<User> {
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email.trim().toLowerCase();
    }
    if (data.passwordHash !== undefined) {
      updateData.passwordHash = data.passwordHash;
    }

    const user = await this.prisma.user.update({
      where: { id: data.id },
      data: updateData,
    });
    return this.toDomain(user);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(record: any): User {
    return User.create({
      id: record.id,
      email: Email.create(record.email),
      name: record.name,
      passwordHash: record.passwordHash,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

export const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserPrismaRepository,
};
