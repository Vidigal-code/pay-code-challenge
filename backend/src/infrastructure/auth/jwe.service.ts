import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jose from "jose";
import { createHash } from "crypto";

export interface JWEPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JWEService {
  private readonly secretKey: Uint8Array;
  private readonly algorithm = "A256GCM";
  private readonly encryptionKey: Uint8Array;

  constructor(private readonly configService: ConfigService) {
    const secret =
      this.configService.get<string>("app.jwe.secret") ||
      "your-256-bit-secret-key-must-be-32-chars-long!!";
    this.secretKey = new TextEncoder().encode(secret);
    // Derive encryption key from secret
    this.encryptionKey = this.deriveKey(this.secretKey);
  }

  private deriveKey(secret: Uint8Array): Uint8Array {
    // Simple key derivation - in production, use PBKDF2 or similar
    const hash = createHash("sha256").update(secret).digest();
    return new Uint8Array(hash.slice(0, 32));
  }

  async encrypt(payload: JWEPayload): Promise<string> {
    const secret = new Uint8Array(this.encryptionKey);
    const jwe = await new jose.EncryptJWT(payload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: "dir", enc: this.algorithm })
      .setIssuedAt()
      .setExpirationTime(
        this.configService.get<string>("app.jwt.expiresIn") || "7d",
      )
      .encrypt(secret);

    return jwe;
  }

  async decrypt(token: string): Promise<JWEPayload> {
    try {
      const secret = new Uint8Array(this.encryptionKey);
      const { payload } = await jose.jwtDecrypt(token, secret);

      return payload as unknown as JWEPayload;
    } catch (error) {
      throw new Error("Invalid or expired JWE token");
    }
  }
}
