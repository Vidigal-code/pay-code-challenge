import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Query,
    UseGuards,
} from "@nestjs/common";
import {ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags} from "@nestjs/swagger";
import {ErrorResponse} from "../../application/dto/error.response.dto";
import {JwtAuthGuard} from "@common/guards/jwt.guard";
import {CurrentUser} from "@common/decorators/current-user.decorator";
// User type from Prisma - using any to avoid compilation issues before Prisma Client is generated
type User = any;
import {DepositDto} from "@application/dto/deposit.dto";
import {TransferDto} from "@application/dto/transfer.dto";
import {ReverseTransactionDto} from "@application/dto/reverse-transaction.dto";
import {CreateWalletUseCase} from "@application/use-cases/create-wallet.usecase";
import {GetWalletUseCase} from "@application/use-cases/get-wallet.usecase";
import {DepositUseCase} from "@application/use-cases/deposit.usecase";
import {TransferUseCase} from "@application/use-cases/transfer.usecase";
import {ReverseTransactionUseCase} from "@application/use-cases/reverse-transaction.usecase";
import {ListTransactionsUseCase} from "@application/use-cases/list-transactions.usecase";
import {GetDashboardKPIsUseCase} from "@application/use-cases/get-dashboard-kpis.usecase";

@ApiTags("wallet")
@ApiCookieAuth()
@Controller("wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(
        private readonly createWalletUseCase: CreateWalletUseCase,
        private readonly getWalletUseCase: GetWalletUseCase,
        private readonly depositUseCase: DepositUseCase,
        private readonly transferUseCase: TransferUseCase,
        private readonly reverseTransactionUseCase: ReverseTransactionUseCase,
        private readonly listTransactionsUseCase: ListTransactionsUseCase,
        private readonly getDashboardKPIsUseCase: GetDashboardKPIsUseCase,
    ) {
    }

    @Post()
    @HttpCode(201)
    @ApiOperation({summary: "Create a wallet for the authenticated user"})
    @ApiResponse({status: 201, description: "Wallet created successfully"})
    @ApiResponse({status: 400, type: ErrorResponse, description: "Wallet already exists"})
    async createWallet(@CurrentUser() user: User) {
        return this.createWalletUseCase.execute({userId: user.id});
    }

    @Get()
    @ApiOperation({summary: "Get wallet information for the authenticated user"})
    @ApiResponse({status: 200, description: "Wallet information"})
    async getWallet(@CurrentUser() user: User) {
        return this.getWalletUseCase.execute({userId: user.id});
    }

    @Post("deposit")
    @HttpCode(200)
    @ApiOperation({summary: "Deposit money into wallet"})
    @ApiBody({type: DepositDto})
    @ApiResponse({status: 200, description: "Deposit successful"})
    @ApiResponse({status: 400, type: ErrorResponse, description: "Invalid amount"})
    async deposit(
        @CurrentUser() user: User,
        @Body() dto: DepositDto,
    ) {
        return this.depositUseCase.execute({
            userId: user.id,
            amount: dto.amount,
            description: dto.description,
        });
    }

    @Post("transfer")
    @HttpCode(200)
    @ApiOperation({summary: "Transfer money to another user"})
    @ApiBody({type: TransferDto})
    @ApiResponse({status: 200, description: "Transfer successful"})
    @ApiResponse({status: 400, type: ErrorResponse, description: "Insufficient balance or invalid amount"})
    async transfer(
        @CurrentUser() user: User,
        @Body() dto: TransferDto,
    ) {
        return this.transferUseCase.execute({
            senderId: user.id,
            receiverId: dto.receiverId,
            amount: dto.amount,
            description: dto.description,
        });
    }

    @Post("transactions/:transactionId/reverse")
    @HttpCode(200)
    @ApiOperation({summary: "Reverse a transaction"})
    @ApiBody({type: ReverseTransactionDto})
    @ApiResponse({status: 200, description: "Transaction reversed successfully"})
    @ApiResponse({status: 400, type: ErrorResponse, description: "Transaction cannot be reversed"})
    async reverseTransaction(
        @CurrentUser() user: User,
        @Param("transactionId") transactionId: string,
        @Body() dto: ReverseTransactionDto,
    ) {
        return this.reverseTransactionUseCase.execute({
            transactionId,
            userId: user.id,
            reason: dto.reason,
        });
    }

    @Get("transactions")
    @ApiOperation({summary: "List transactions for the authenticated user"})
    @ApiResponse({status: 200, description: "List of transactions"})
    async listTransactions(
        @CurrentUser() user: User,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
        @Query("type") type?: string,
        @Query("status") status?: string,
    ) {
        return this.listTransactionsUseCase.execute({
            userId: user.id,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
            type,
            status,
        });
    }

    @Get("dashboard/kpis")
    @ApiOperation({summary: "Get dashboard KPIs for the authenticated user"})
    @ApiResponse({status: 200, description: "Dashboard KPIs"})
    async getDashboardKPIs(
        @CurrentUser() user: User,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
    ) {
        return this.getDashboardKPIsUseCase.execute({
            userId: user.id,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
}

