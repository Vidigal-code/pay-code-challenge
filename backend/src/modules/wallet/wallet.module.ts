import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { RabbitMQModule } from "@infrastructure/messaging/rabbitmq.module";
import { AuthInfraModule } from "@infrastructure/auth/auth-infra.module";
import { WalletController } from "@interfaces/http/wallet.controller";
import { CreateWalletUseCase } from "@application/use-cases/wallets/create-wallet.usecase";
import { GetWalletUseCase } from "@application/use-cases/wallets/get-wallet.usecase";
import { DepositUseCase } from "@application/use-cases/wallets/deposit.usecase";
import { TransferUseCase } from "@application/use-cases/wallets/transfer.usecase";
import { ReverseTransactionUseCase } from "@application/use-cases/transactions/reverse-transaction.usecase";
import { ListTransactionsUseCase } from "@application/use-cases/transactions/list-transactions.usecase";
import { GetDashboardKPIsUseCase } from "@application/use-cases/dashboard/get-dashboard-kpis.usecase";
import { WALLET_REPOSITORY } from "@domain/repositories/wallet.repository";
import { TRANSACTION_REPOSITORY } from "@domain/repositories/transaction.repository";
import { USER_REPOSITORY } from "@domain/repositories/user.repository";

@Module({
  imports: [InfrastructureModule, RabbitMQModule, AuthInfraModule],
  controllers: [WalletController],
  providers: [
    {
      provide: CreateWalletUseCase,
      useFactory: (walletRepo, userRepo) =>
        new CreateWalletUseCase(walletRepo, userRepo),
      inject: [WALLET_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: GetWalletUseCase,
      useFactory: (walletRepo, userRepo) =>
        new GetWalletUseCase(walletRepo, userRepo),
      inject: [WALLET_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: DepositUseCase,
      useFactory: (walletRepo, transactionRepo, userRepo, domainEvents) =>
        new DepositUseCase(walletRepo, transactionRepo, userRepo, domainEvents),
      inject: [
        WALLET_REPOSITORY,
        TRANSACTION_REPOSITORY,
        USER_REPOSITORY,
        "DOMAIN_EVENTS_SERVICE",
      ],
    },
    {
      provide: TransferUseCase,
      useFactory: (walletRepo, transactionRepo, userRepo, domainEvents) =>
        new TransferUseCase(
          walletRepo,
          transactionRepo,
          userRepo,
          domainEvents,
        ),
      inject: [
        WALLET_REPOSITORY,
        TRANSACTION_REPOSITORY,
        USER_REPOSITORY,
        "DOMAIN_EVENTS_SERVICE",
      ],
    },
    {
      provide: ReverseTransactionUseCase,
      useFactory: (transactionRepo, walletRepo, userRepo) =>
        new ReverseTransactionUseCase(transactionRepo, walletRepo, userRepo),
      inject: [TRANSACTION_REPOSITORY, WALLET_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: ListTransactionsUseCase,
      useFactory: (transactionRepo, userRepo) =>
        new ListTransactionsUseCase(transactionRepo, userRepo),
      inject: [TRANSACTION_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: GetDashboardKPIsUseCase,
      useFactory: (walletRepo, transactionRepo, userRepo) =>
        new GetDashboardKPIsUseCase(walletRepo, transactionRepo, userRepo),
      inject: [WALLET_REPOSITORY, TRANSACTION_REPOSITORY, USER_REPOSITORY],
    },
  ],
})
export class WalletModule {}
