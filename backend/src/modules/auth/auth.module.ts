import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthInfraModule } from "@infrastructure/auth/auth-infra.module";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { AuthController } from "@interfaces/http/auth.controller";
import { SignupUseCase } from "@application/use-cases/signup.usecase";
import { LoginUseCase } from "@application/use-cases/login.usecase";
import { DeleteAccountUseCase } from "@application/use-cases/delete-account.usecase";
import { USER_REPOSITORY } from "@domain/repositories/user.repository";
import { HASHING_SERVICE } from "@application/ports/hashing.service";
import { WALLET_REPOSITORY } from "@domain/repositories/wallet.repository";
import { TRANSACTION_REPOSITORY } from "@domain/repositories/transaction.repository";

@Module({
  imports: [ConfigModule, AuthInfraModule, InfrastructureModule],
  controllers: [AuthController],
  providers: [
    {
      provide: SignupUseCase,
      useFactory: (userRepo, walletRepo, hashingService) =>
        new SignupUseCase(userRepo, walletRepo, hashingService),
      inject: [USER_REPOSITORY, WALLET_REPOSITORY, HASHING_SERVICE],
    },
    {
      provide: LoginUseCase,
      useFactory: (userRepo, hashingService) =>
        new LoginUseCase(userRepo, hashingService),
      inject: [USER_REPOSITORY, HASHING_SERVICE],
    },
    {
      provide: DeleteAccountUseCase,
      useFactory: (userRepo, walletRepo, transactionRepo) =>
        new DeleteAccountUseCase(userRepo, walletRepo, transactionRepo),
      inject: [USER_REPOSITORY, WALLET_REPOSITORY, TRANSACTION_REPOSITORY],
    },
  ],
  exports: [SignupUseCase, LoginUseCase, DeleteAccountUseCase],
})
export class AuthModule {}
