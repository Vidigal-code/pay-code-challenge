import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";

export interface JWK {
  kty: string;
  use: string;
  kid: string;
  alg: string;
  k: string; // Base64URL encoded key
}

@Injectable()
export class JWKSService implements OnModuleInit {
  private keys: Map<string, Uint8Array> = new Map();
  private currentKid!: string;
  private readonly rotationInterval: number;
  private rotationTimer?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.rotationInterval = parseInt(
      this.configService.get<string>("app.jwks.rotationInterval") || "86400000", // 24 horas
      10,
    );
  }

  async onModuleInit() {
    // Gera chave inicial
    await this.generateNewKey();
    // Inicia rotação automática
    this.startRotation();
  }

  onModuleDestroy() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }

  private async generateNewKey(): Promise<string> {
    // Gera chave AES-256 (32 bytes)
    const key = randomBytes(32);
    const kid = createHash("sha256").update(key).digest("hex").substring(0, 16);

    this.keys.set(kid, key);
    this.currentKid = kid;

    // Mantém apenas as últimas 3 chaves (permite rotação gradual)
    if (this.keys.size > 3) {
      const oldestKid = Array.from(this.keys.keys())[0];
      this.keys.delete(oldestKid);
    }

    return kid;
  }

  private startRotation() {
    this.rotationTimer = setInterval(async () => {
      await this.generateNewKey();
    }, this.rotationInterval);
  }

  getCurrentKey(): { kid: string; key: Uint8Array } {
    return {
      kid: this.currentKid,
      key: this.keys.get(this.currentKid)!,
    };
  }

  getKey(kid: string): Uint8Array | undefined {
    return this.keys.get(kid);
  }

  async getJWKS(): Promise<{ keys: JWK[] }> {
    const jwks: JWK[] = [];

    for (const [kid, key] of this.keys.entries()) {
      jwks.push({
        kty: "oct",
        use: "enc",
        kid,
        alg: "A256GCM",
        k: Buffer.from(key).toString("base64url"),
      });
    }

    return { keys: jwks };
  }

  async rotateKey(): Promise<string> {
    return await this.generateNewKey();
  }
}
