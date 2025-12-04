import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { FinancialEventsProducer } from "@infrastructure/messaging/financial-events.producer";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/financial-events",
})
export class FinancialEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(FinancialEventsGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly financialEventsProducer: FinancialEventsProducer,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verificar token JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>("app.jwt.secret") ||
          process.env.JWT_SECRET,
      });

      const userId = payload.sub;
      if (!userId) {
        this.logger.warn(
          `Client ${client.id} disconnected: Invalid token payload`,
        );
        client.disconnect();
        return;
      }

      this.connectedUsers.set(client.id, userId);
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} disconnected: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      client.leave(`user:${userId}`);
      this.connectedUsers.delete(client.id);
      this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
    }
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      client.emit("subscribed", { userId });
      this.logger.log(
        `Client ${client.id} subscribed to financial events for user ${userId}`,
      );
    }
  }

  // Métodos para emitir eventos para clientes específicos
  emitTransactionCreated(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("transaction.created", data);
  }

  emitTransactionCompleted(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("transaction.completed", data);
  }

  emitTransactionReversed(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("transaction.reversed", data);
  }

  emitWalletBalanceUpdated(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("wallet.balance.updated", data);
  }
}
