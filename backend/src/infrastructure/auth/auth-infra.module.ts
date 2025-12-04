import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { InfrastructureModule } from "../infrastructure.module";
import { JwtStrategy } from "./jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BcryptHashingService } from "./bcrypt-hashing.service";
import { HASHING_SERVICE } from "@application/ports/hashing.service";
import { JWEService } from "./jwe.service";
import { JWKSService } from "./jwks.service";
import { KMSService } from "./kms.service";
import { SensitiveDataJWEService } from "./sensitive-data-jwe.service";
import { JwtAuthGuard } from "@common/guards/jwt.guard";
import { USER_REPOSITORY } from "@domain/repositories/user.repository";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("app.jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("app.jwt.expiresIn"),
        },
      }),
    }),
    InfrastructureModule,
  ],
  providers: [
    JwtStrategy,
    JWEService,
    JWKSService,
    KMSService,
    SensitiveDataJWEService,
    {
      provide: HASHING_SERVICE,
      useClass: BcryptHashingService,
    },
    {
      provide: JwtAuthGuard,
      useFactory: (
        configService: ConfigService,
        jweService: JWEService,
        jwtService: JwtService,
        userRepository: any,
      ) => {
        return new JwtAuthGuard(
          configService,
          jweService,
          jwtService,
          userRepository,
        );
      },
      inject: [ConfigService, JWEService, JwtService, USER_REPOSITORY],
    },
  ],
  exports: [
    JwtModule,
    PassportModule,
    HASHING_SERVICE,
    JWEService,
    JWKSService,
    KMSService,
    SensitiveDataJWEService,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AuthInfraModule {}
