import { User } from "../entities/user.entity";

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  passwordHash?: string;
}

export interface UserRepository {
  create(data: CreateUserInput): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  update(data: UpdateUserInput): Promise<User>;

  deleteById(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
