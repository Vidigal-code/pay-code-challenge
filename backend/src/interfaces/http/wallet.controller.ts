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
import {ApplicationError} from "@application/errors/application-error";

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
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        return this.createWalletUseCase.execute({userId});
    }

    @Get()
    @ApiOperation({summary: "Get wallet information for the authenticated user"})
    @ApiResponse({status: 200, description: "Wallet information"})
    async getWallet(@CurrentUser() user: User) {
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        return this.getWalletUseCase.execute({userId});
    }

    @Post("deposit")
    @HttpCode(200)
    @ApiOperation({
        summary: "Deposit money into wallet",
        description: "Adds funds to the authenticated user's wallet. Supports negative balance - if balance is negative, deposit adds to current value. Minimum amount: 0.01",
    })
    @ApiBody({
        type: DepositDto,
        description: "Deposit amount and optional description",
        examples: {
            example1: {
                summary: "Standard deposit",
                value: {amount: 100.50, description: "Initial deposit"},
            },
            example2: {
                summary: "Deposit with negative balance",
                value: {amount: 50.00, description: "Recovery deposit"},
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "Deposit successful",
        schema: {
            type: "object",
            properties: {
                transaction: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        type: {type: "string", enum: ["DEPOSIT"]},
                        status: {type: "string", enum: ["COMPLETED"]},
                        amount: {type: "number"},
                        description: {type: "string", nullable: true},
                    },
                },
                wallet: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        balance: {type: "number"},
                        userId: {type: "string"},
                    },
                },
            },
        },
    })
    @ApiResponse({status: 400, type: ErrorResponse, description: "Invalid amount (must be > 0)"})
    async deposit(
        @CurrentUser() user: User,
        @Body() dto: DepositDto,
    ) {
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        return this.depositUseCase.execute({
            userId,
            amount: dto.amount,
            description: dto.description,
        });
    }

    @Post("transfer")
    @HttpCode(200)
    @ApiOperation({
        summary: "Transfer money to another user",
        description: "Transfers funds from authenticated user to another user. Validates sufficient balance before processing. Minimum amount: 0.01. Cannot transfer to self.",
    })
    @ApiBody({
        type: TransferDto,
        description: "Transfer details",
        examples: {
            example1: {
                summary: "Standard transfer",
                value: {receiverId: "user-id-123", amount: 50.00, description: "Payment for services"},
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "Transfer successful",
        schema: {
            type: "object",
            properties: {
                transaction: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        type: {type: "string", enum: ["TRANSFER"]},
                        status: {type: "string", enum: ["COMPLETED"]},
                        amount: {type: "number"},
                    },
                },
                senderWallet: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        balance: {type: "number"},
                    },
                },
                receiverWallet: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        balance: {type: "number"},
                    },
                },
            },
        },
    })
    @ApiResponse({status: 400, type: ErrorResponse, description: "Insufficient balance, invalid amount, or cannot transfer to self"})
    @ApiResponse({status: 404, type: ErrorResponse, description: "Receiver not found"})
            async transfer(
                @CurrentUser() user: User,
                @Body() dto: TransferDto,
            ) {
                const userId = user?.sub || user?.id;
                if (!userId) {
                    throw new ApplicationError("USER_NOT_AUTHENTICATED");
                }
                const transferAmount = Number(dto.amount);
                if (isNaN(transferAmount) || transferAmount <= 0) {
                    throw new ApplicationError("INVALID_AMOUNT");
                }
                return this.transferUseCase.execute({
                    senderId: userId,
                    receiverId: dto.receiverId,
                    amount: transferAmount,
                    description: dto.description,
                });
            }

    @Post("transactions/:transactionId/reverse")
    @HttpCode(200)
    @ApiOperation({
        summary: "Reverse a transaction",
        description: "Reverses a completed DEPOSIT or TRANSFER transaction. For deposits, subtracts the amount. For transfers, returns money to sender and subtracts from receiver. Can result in negative balance. Only COMPLETED transactions can be reversed.",
    })
    @ApiBody({
        type: ReverseTransactionDto,
        description: "Optional reason for reversal",
        examples: {
            example1: {
                summary: "Reversal with reason",
                value: {reason: "User requested refund"},
            },
            example2: {
                summary: "Reversal without reason",
                value: {},
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "Transaction reversed successfully",
        schema: {
            type: "object",
            properties: {
                reversalTransaction: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        type: {type: "string", enum: ["REVERSAL"]},
                        status: {type: "string", enum: ["COMPLETED"]},
                        amount: {type: "number"},
                    },
                },
                originalTransaction: {
                    type: "object",
                    properties: {
                        id: {type: "string"},
                        status: {type: "string", enum: ["REVERSED"]},
                    },
                },
            },
        },
    })
    @ApiResponse({status: 400, type: ErrorResponse, description: "Transaction cannot be reversed (not COMPLETED or already reversed)"})
    @ApiResponse({status: 404, type: ErrorResponse, description: "Transaction not found"})
    async reverseTransaction(
        @CurrentUser() user: User,
        @Param("transactionId") transactionId: string,
        @Body() dto: ReverseTransactionDto,
    ) {
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        return this.reverseTransactionUseCase.execute({
            transactionId,
            userId,
            reason: dto.reason,
        });
    }

    @Get("transactions")
    @ApiOperation({
        summary: "List transactions for the authenticated user",
        description: "Returns paginated list of transactions. Supports filtering by type (DEPOSIT, TRANSFER, REVERSAL) and status (PENDING, COMPLETED, REVERSED, FAILED).",
    })
    @ApiResponse({
        status: 200,
        description: "List of transactions with pagination",
        schema: {
            type: "object",
            properties: {
                transactions: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: {type: "string"},
                            type: {type: "string", enum: ["DEPOSIT", "TRANSFER", "REVERSAL"]},
                            status: {type: "string", enum: ["PENDING", "COMPLETED", "REVERSED", "FAILED"]},
                            amount: {type: "number"},
                            description: {type: "string", nullable: true},
                            createdAt: {type: "string", format: "date-time"},
                        },
                    },
                },
                total: {type: "number"},
                page: {type: "number"},
                pageSize: {type: "number"},
            },
        },
    })
    @ApiResponse({status: 400, type: ErrorResponse, description: "Invalid pagination parameters or filters"})
    async listTransactions(
        @CurrentUser() user: User,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
        @Query("type") type?: string,
        @Query("status") status?: string,
    ) {
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        
        let parsedPage: number | undefined = undefined;
        let parsedPageSize: number | undefined = undefined;
        
        if (page && page.trim() !== '') {
            const pageNum = parseInt(page, 10);
            if (!isNaN(pageNum) && pageNum > 0) {
                parsedPage = pageNum;
            }
        }
        
        if (pageSize && pageSize.trim() !== '') {
            const pageSizeNum = parseInt(pageSize, 10);
            if (!isNaN(pageSizeNum) && pageSizeNum > 0) {
                parsedPageSize = Math.min(pageSizeNum, 100);
            }
        }
        
        return this.listTransactionsUseCase.execute({
            userId,
            page: parsedPage,
            pageSize: parsedPageSize,
            type: type?.trim() || undefined,
            status: status?.trim() || undefined,
        });
    }

    @Get("dashboard/kpis")
    @ApiOperation({
        summary: "Get dashboard KPIs for the authenticated user",
        description: "Returns financial KPIs including total balance, deposits, transfers, received amounts, and transaction statistics. Supports date range filtering (default: last 30 days).",
    })
    @ApiResponse({
        status: 200,
        description: "Dashboard KPIs",
        schema: {
            type: "object",
            properties: {
                kpis: {
                    type: "object",
                    properties: {
                        totalBalance: {type: "number", description: "Current wallet balance"},
                        totalDeposits: {type: "number", description: "Total deposits in period"},
                        totalTransfers: {type: "number", description: "Total sent in transfers"},
                        totalReceived: {type: "number", description: "Total received in transfers"},
                        totalTransactions: {type: "number", description: "Total transactions count"},
                        completedTransactions: {type: "number", description: "Completed transactions count"},
                        failedTransactions: {type: "number", description: "Failed transactions count"},
                        reversedTransactions: {type: "number", description: "Reversed transactions count"},
                    },
                },
            },
        },
    })
    @ApiResponse({status: 400, type: ErrorResponse, description: "Invalid date format"})
    async getDashboardKPIs(
        @CurrentUser() user: User,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
    ) {
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new ApplicationError("USER_NOT_AUTHENTICATED");
        }
        
        const parsedStartDate = startDate ? new Date(startDate) : undefined;
        const parsedEndDate = endDate ? new Date(endDate) : undefined;
        
        if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
            throw new ApplicationError("INVALID_DATE");
        }
        if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
            throw new ApplicationError("INVALID_DATE");
        }
        
        return this.getDashboardKPIsUseCase.execute({
            userId,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
        });
    }
}

