import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { JWEService } from "@infrastructure/auth/jwe.service";
import { JwtService } from "@nestjs/jwt";
import {
  UserRepository,
  USER_REPOSITORY,
} from "@domain/repositories/user.repository";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly useJWE: boolean;
  private readonly cookieName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jweService: JWEService,
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {
    super();
    this.useJWE = configService.get<boolean>("app.jwe.enabled") ?? true;
    this.cookieName =
      configService.get<string>("app.jwt.cookieName") ?? "paycode_session";
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.[this.cookieName];

    if (!token) {
      return false;
    }

    if (this.useJWE) {
      try {
        const decrypted = await this.jweService.decrypt(token);
        const user = await this.userRepository.findById(decrypted.sub);
        if (!user) {
          throw new UnauthorizedException("USER_NOT_FOUND");
        }
        request.user = {
          sub: user.id,
          email: user.email.toString(),
        };
        return true;
      } catch (error) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>("app.jwt.secret"),
          });
          const user = await this.userRepository.findById(payload.sub);
          if (!user) {
            throw new UnauthorizedException("USER_NOT_FOUND");
          }
          request.user = {
            sub: user.id,
            email: user.email.toString(),
          };
          return true;
        } catch (jwtError) {
          throw new UnauthorizedException("INVALID_TOKEN");
        }
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
