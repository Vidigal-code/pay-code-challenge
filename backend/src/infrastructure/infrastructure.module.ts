import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { userRepositoryProvider } from "./prisma/user.prisma.repository";
import { RabbitMQModule } from "./messaging/rabbitmq.module";
import { walletRepositoryProvider } from "./prisma/wallet.prisma.repository";
import { transactionRepositoryProvider } from "./prisma/transaction.prisma.repository";

const repositoryProviders = [
  userRepositoryProvider,
  walletRepositoryProvider,
  transactionRepositoryProvider,
];

@Module({
  imports: [RabbitMQModule],
  providers: [PrismaService, ...repositoryProviders],
  exports: [PrismaService, RabbitMQModule, ...repositoryProviders],
})
export class InfrastructureModule {}
