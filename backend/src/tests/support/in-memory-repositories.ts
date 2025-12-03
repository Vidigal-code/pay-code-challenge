import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from "@domain/repositories/user.repository";
import { User } from "@domain/entities/user.entity";
import { Email } from "@domain/value-objects/email.vo";
import { EmailValidationService } from "@application/ports/email-validation.service";

function randomId() {
  return Math.random().toString(36).slice(2);
}

export class InMemoryUserRepository implements UserRepository {
  items: User[] = [];

  async create(data: CreateUserInput): Promise<User> {
    const now = new Date();
    const user = User.create({
      id: randomId(),
      email: Email.create(data.email),
      name: data.name,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    this.items.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email.toString() === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((u) => u.id === id) || null;
  }

  async update(data: UpdateUserInput): Promise<User> {
    const user = await this.findById(data.id);
    if (!user) throw new Error("NOT_FOUND");
    return user;
  }

  async deleteById(id: string): Promise<void> {
    this.items = this.items.filter((u) => u.id !== id);
  }

}

export class FakeHashingService {
  async hash(raw: string): Promise<string> {
    return `hashed:${raw}`;
  }

  async compare(raw: string, hash: string): Promise<boolean> {
    return hash === `hashed:${raw}`;
  }
}

export class FakeDomainEventsService {
  async publish(_: any): Promise<void> {}
}

export class AlwaysTrueEmailValidationService
  implements EmailValidationService
{
  async exists(_email: string): Promise<boolean> {
    return true;
  }
}
