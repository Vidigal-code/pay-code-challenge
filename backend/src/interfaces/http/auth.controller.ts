import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ErrorResponse } from "@application/dto/error.response.dto";
import { JwtAuthGuard } from "@common/guards/jwt.guard";
import { CurrentUser } from "@common/decorators/current-user.decorator";
import { UpdateProfileDto } from "@application/dto/update-profile.dto";
import {
  USER_REPOSITORY,
  UserRepository,
} from "@domain/repositories/user.repository";
import {
  HASHING_SERVICE,
  HashingService,
} from "@application/ports/hashing.service";
import { Response } from "express";
import { SignupDto } from "@application/dto/signup.dto";
import { LoginDto } from "@application/dto/login.dto";
import { SignupUseCase } from "@application/use-cases/auths/signup.usecase";
import { LoginUseCase } from "@application/use-cases/auths/login.usecase";
import { DeleteAccountUseCase } from "@application/use-cases/account/delete-account.usecase";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JWEService } from "@infrastructure/auth/jwe.service";
import { ApplicationError } from "@application/errors/application-error";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly cookieName: string;
  private readonly useJWE: boolean;

  constructor(
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly jwtService: JwtService,
    private readonly jweService: JWEService,
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(HASHING_SERVICE) private readonly hashing: HashingService,
  ) {
    this.cookieName =
      this.configService.get<string>("app.jwt.cookieName") ?? "paycode_session";
    this.useJWE = this.configService.get<boolean>("app.jwe.enabled") ?? true;
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get authenticated user profile",
    description:
      "Returns the profile data of the currently authenticated user. Requires valid JWT/JWE token in cookie.",
  })
  @ApiResponse({
    status: 200,
    description: "Profile returned",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponse,
    description: "Unauthorized - invalid or missing token",
  })
  async profile(@CurrentUser() user: any) {
    const dbUser = await this.userRepo.findById(user.sub);
    if (!dbUser) {
      return { id: user.sub, email: user.email };
    }
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email.toString(),
    };
  }

  @Post("signup")
  @ApiOperation({
    summary: "Create a new user account",
    description:
      "Registers a new user with email, name, and password. Automatically creates a wallet with zero balance. Returns JWT/JWE token in httpOnly cookie.",
  })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error",
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 409,
    description: "Email already used",
    type: ErrorResponse,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "name", "password"],
      properties: {
        email: { type: "string", format: "email", example: "john@example.com" },
        name: { type: "string", minLength: 1, example: "John Doe" },
        password: { type: "string", minLength: 8, example: "SecurePass123!" },
      },
    },
  })
  async signup(
    @Body() body: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = await this.signupUseCase.execute(body);

    const payload = {
      sub: user.id,
      email: user.email.toString(),
    };

    const token = this.useJWE
      ? await this.jweService.encrypt(payload)
      : await this.jwtService.signAsync(payload);

    this.attachCookie(res, token);
    return user.toJSON();
  }

  @HttpCode(200)
  @Post("login")
  @ApiOperation({
    summary: "Login with email and password",
    description:
      "Authenticates user with email and password. Returns JWT/JWE token in httpOnly cookie. Token expires in 7 days (configurable).",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
    type: ErrorResponse,
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "john@example.com" },
        password: { type: "string", example: "SecurePass123!" },
      },
    },
  })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = await this.loginUseCase.execute(body);

    const payload = {
      sub: user.id,
      email: user.email.toString(),
    };

    const token = this.useJWE
      ? await this.jweService.encrypt(payload)
      : await this.jwtService.signAsync(payload);

    this.attachCookie(res, token);
    return user.toJSON();
  }

  @Post("profile")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Update current user profile",
    description:
      "Updates user profile fields (name, email, password). Email and password updates require currentPassword. Returns updated user data and new JWT/JWE token.",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation errors or missing current password",
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: "Invalid current password",
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 409,
    description: "Email already in use",
    type: ErrorResponse,
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.name && !dto.email && !dto.newPassword) {
      throw new ApplicationError("NO_FIELDS_TO_UPDATE");
    }

    if ((dto.email || dto.newPassword) && !dto.currentPassword) {
      throw new ApplicationError("CURRENT_PASSWORD_REQUIRED");
    }

    let passwordHash: string | undefined;
    if (dto.newPassword) {
      const dbUser = await this.userRepo.findById(user.sub);
      if (!dbUser) {
        throw new ApplicationError("USER_NOT_FOUND");
      }
      const ok = await this.hashing.compare(
        dto.currentPassword || "",
        dbUser.passwordHash,
      );
      if (!ok) {
        throw new ApplicationError("INVALID_CURRENT_PASSWORD");
      }
      passwordHash = await this.hashing.hash(dto.newPassword);
    }

    if (dto.email) {
      const existing = await this.userRepo.findByEmail(dto.email);
      if (existing && existing.id !== user.sub) {
        throw new ApplicationError("EMAIL_ALREADY_USED");
      }
    }

    const updated = await this.userRepo.update({
      id: user.sub,
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const payload = {
      sub: updated.id,
      email: updated.email.toString(),
    };

    const newToken = this.useJWE
      ? await this.jweService.encrypt(payload)
      : await this.jwtService.signAsync(payload);
    this.attachCookie(res, newToken);
    return updated.toJSON();
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Logout from current session" })
  @ApiResponse({ status: 200, description: "Session ended" })
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie(this.cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: this.configService.get("app.nodeEnv") === "production",
      expires: new Date(0),
      path: "/",
    });
    return { success: true };
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Delete user account",
    description:
      "Permanently deletes the authenticated user's account, wallet, and all associated data. This action cannot be undone.",
  })
  @ApiResponse({ status: 200, description: "Account deleted successfully" })
  @ApiResponse({
    status: 401,
    type: ErrorResponse,
    description: "Unauthorized",
  })
  async deleteAccount(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.deleteAccountUseCase.execute({ userId: user.sub });

    res.cookie(this.cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: this.configService.get("app.nodeEnv") === "production",
      expires: new Date(0),
      path: "/",
    });

    return { success: true, message: "Account deleted successfully" };
  }

  private attachCookie(res: Response, token: string) {
    res.cookie(this.cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.configService.get("app.nodeEnv") === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
}
