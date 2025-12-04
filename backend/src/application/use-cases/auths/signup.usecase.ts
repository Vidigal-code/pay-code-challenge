import { UserRepository } from "@domain/repositories/user.repository";
import { WalletRepository } from "@domain/repositories/wallet.repository";
import { HashingService } from "@application/ports/hashing.service";
import { ApplicationError } from "@application/errors/application-error";
import { ErrorCode } from "@application/errors/error-code";

export interface SignupInput {
  email: string;
  name: string;
  password: string;
}

export class SignupUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly hashingService: HashingService,
  ) {}

  async execute(input: SignupInput) {
    // Validate required fields
    if (!input.email || !input.name || !input.password) {
      throw new ApplicationError(
        ErrorCode.MISSING_USER_DATA,
        "Email, name, and password are required",
      );
    }

    const email = input.email.trim().toLowerCase();

    // Validate email format before creating Email value object
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApplicationError(
        ErrorCode.INVALID_EMAIL,
        "Invalid email format",
      );
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ApplicationError(ErrorCode.EMAIL_ALREADY_USED);
    }

    const passwordHash = await this.hashingService.hash(input.password);

    // Create user first
    const user = await this.userRepository.create({
      email,
      name: input.name,
      passwordHash,
    });

    // Create wallet - if this fails, the user will exist but wallet won't
    // This is acceptable as the wallet can be created later if needed
    try {
      await this.walletRepository.create({
        userId: user.id,
        balance: 0,
      });
    } catch (error: any) {
      // If it's an ApplicationError, check the error code
      if (error instanceof ApplicationError) {
        // If wallet already exists, that's fine - return the user
        if (error.code === ErrorCode.WALLET_ALREADY_EXISTS) {
          return { user };
        }
        // If user not found, this is a serious issue - user was just created
        if (error.code === ErrorCode.USER_NOT_FOUND) {
          // Double-check user exists
          const doubleCheck = await this.userRepository.findById(user.id);
          if (!doubleCheck) {
            // User was deleted somehow - this is a critical error
            throw new ApplicationError(
              ErrorCode.INTERNAL_SERVER_ERROR,
              `User ${user.id} was created but not found - cannot create wallet`,
            );
          }
          // User exists but wallet creation failed - this is a database issue
          throw new ApplicationError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            `User ${user.id} exists but wallet creation failed: ${error.message}`,
          );
        }
        // Re-throw other ApplicationErrors
        throw error;
      }
      // If wallet creation fails due to foreign key constraint, it means user doesn't exist
      // This shouldn't happen since we just created the user
      if (
        error?.code === "P2003" ||
        error?.message?.includes("Foreign key constraint") ||
        error?.message?.includes("does not exist")
      ) {
        // Double-check user exists
        const doubleCheck = await this.userRepository.findById(user.id);
        if (!doubleCheck) {
          throw new ApplicationError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            `User ${user.id} was created but not found - cannot create wallet`,
          );
        }
        // User exists but wallet creation failed - this is a database issue
        throw new ApplicationError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `User ${user.id} exists but wallet creation failed: ${error.message}`,
        );
      }
      // If it's a duplicate wallet error, that's okay - wallet already exists
      if (
        error?.code === "P2002" ||
        error?.message?.includes("already exists") ||
        error?.message?.includes("WALLET_ALREADY_EXISTS")
      ) {
        // Wallet already exists, which is fine
        return { user };
      }
      // Re-throw other errors
      throw error;
    }

    return { user };
  }
}
