import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KMSService } from "./kms.service";
import * as jose from "jose";

/**
 * JWE Service para dados sensíveis (CPF, cartão, transferência)
 * Usa KMS para gerenciar chaves de criptografia
 */
@Injectable()
export class SensitiveDataJWEService {
  private readonly keyId: string;
  private readonly algorithm = "A256GCM";

  constructor(
    private readonly configService: ConfigService,
    private readonly kms: KMSService,
  ) {
    this.keyId =
      this.configService.get<string>("KMS_KEY_ID") || "sensitive-data-key";
  }

  /**
   * Criptografa dados sensíveis (CPF, número de cartão, etc.)
   */
  async encryptSensitiveData(data: Record<string, any>): Promise<string> {
    // Usa KMS para obter chave de criptografia (gera se não existir)
    const keyData = await this.kms.decryptDataKey(this.keyId);
    const key = new Uint8Array(keyData);

    // Cria JWE com dados sensíveis
    const jwe = await new jose.EncryptJWT(data)
      .setProtectedHeader({ alg: "dir", enc: this.algorithm })
      .setIssuedAt()
      .setExpirationTime("1h") // Dados sensíveis expiram rápido
      .encrypt(key);

    return jwe;
  }

  /**
   * Descriptografa dados sensíveis
   */
  async decryptSensitiveData(token: string): Promise<Record<string, any>> {
    try {
      // Obtém chave do KMS
      const keyData = await this.kms.decryptDataKey(this.keyId);
      const key = new Uint8Array(keyData);

      const { payload } = await jose.jwtDecrypt(token, key);

      return payload as Record<string, any>;
    } catch (error) {
      throw new Error("Invalid or expired sensitive data token");
    }
  }

  /**
   * Criptografa CPF
   */
  async encryptCPF(cpf: string): Promise<string> {
    return await this.encryptSensitiveData({ cpf });
  }

  /**
   * Criptografa número de cartão
   */
  async encryptCardNumber(cardNumber: string): Promise<string> {
    // Mascara antes de criptografar (últimos 4 dígitos)
    const masked = `****-****-****-${cardNumber.slice(-4)}`;
    return await this.encryptSensitiveData({ cardNumber, masked });
  }

  /**
   * Criptografa dados de transferência
   */
  async encryptTransferData(data: {
    amount: number;
    receiverId: string;
    description?: string;
  }): Promise<string> {
    return await this.encryptSensitiveData({
      type: "transfer",
      ...data,
    });
  }
}
