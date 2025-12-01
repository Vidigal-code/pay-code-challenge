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
import { ApplicationError } from "@application/errors/application-error";
import { ErrorCode } from "@application/errors/error-code";

@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput): Promise<User> {
    let userId: string | null = null;
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          name: data.name,
          passwordHash: data.passwordHash,
        },
      });
      userId = user.id;
      try {
        return this.toDomain(user);
      } catch (domainError: any) {
        // If toDomain fails, we need to clean up the user that was created
        // This prevents orphaned users in the database
        try {
          await this.prisma.user.delete({ where: { id: userId } });
        } catch (deleteError) {
          // If deletion fails, log but don't throw - the original error is more important
          console.error(`Failed to clean up user ${userId} after toDomain error:`, deleteError);
        }
        throw domainError; // Re-throw the original domain error
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ApplicationError(ErrorCode.EMAIL_ALREADY_IN_USE, "Email already in use");
      }
      throw error;
    }
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

    if (Object.keys(updateData).length === 0) {
      const existing = await this.findById(data.id);
      if (!existing) {
        throw new ApplicationError(ErrorCode.USER_NOT_FOUND, "User not found");
      }
      return existing;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: data.id },
        data: updateData,
      });
      return this.toDomain(user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApplicationError(ErrorCode.USER_NOT_FOUND, "User not found");
      }
      throw error;
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private toDomain(record: any): User {
    try {
      return User.create({
        id: record.id,
        email: Email.create(record.email),
        name: record.name,
        passwordHash: record.passwordHash,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    } catch (error: any) {
      if (error.message === "INVALID_EMAIL") {
        throw new ApplicationError(ErrorCode.INVALID_EMAIL, "Invalid email format");
      }
      throw error;
    }
  }
}

export const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserPrismaRepository,
};
