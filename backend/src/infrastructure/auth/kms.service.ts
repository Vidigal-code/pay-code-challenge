import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {createHash, randomBytes, createCipheriv, createDecipheriv} from "crypto";

/**
 * KMS Service - Simula AWS KMS / GCP KMS para ambiente local
 * Em produção, substituir por integração real com AWS KMS ou GCP KMS
 */
@Injectable()
export class KMSService {
    private readonly masterKey: Buffer;
    private readonly keyStore: Map<string, Buffer> = new Map();

    constructor(private readonly configService: ConfigService) {
        // Em produção, isso viria do KMS real
        const masterKeyEnv = this.configService.get<string>("KMS_MASTER_KEY");
        this.masterKey = masterKeyEnv
            ? Buffer.from(masterKeyEnv, "hex")
            : randomBytes(32); // Apenas para desenvolvimento local
    }

    /**
     * Gera uma chave de criptografia usando KMS
     * Em produção, chamaria AWS KMS GenerateDataKey ou GCP KMS
     */
    async generateDataKey(keyId: string): Promise<{plaintext: Buffer; ciphertext: Buffer}> {
        // Simula geração de chave via KMS
        const plaintext = randomBytes(32);
        
        // Simula criptografia da chave (em produção, KMS faria isso)
        const ciphertext = this.encryptKey(plaintext);
        
        this.keyStore.set(keyId, plaintext);
        
        return {plaintext, ciphertext};
    }

    /**
     * Descriptografa uma chave usando KMS
     * Em produção, chamaria AWS KMS Decrypt ou GCP KMS
     */
    async decryptDataKey(keyId: string, ciphertext?: Buffer): Promise<Buffer> {
        if (this.keyStore.has(keyId)) {
            return this.keyStore.get(keyId)!;
        }
        
        // Se não existe, gera nova chave
        const {plaintext} = await this.generateDataKey(keyId);
        return plaintext;
    }

    /**
     * Criptografa dados sensíveis usando chave do KMS
     */
    async encryptSensitiveData(data: string, keyId: string): Promise<string> {
        const key = await this.getOrCreateKey(keyId);
        const iv = randomBytes(12); // GCM nonce
        
        // Usa AES-256-GCM (simulado)
        const cipher = createCipheriv("aes-256-gcm", key, iv);
        let encrypted = cipher.update(data, "utf8", "base64url");
        encrypted += cipher.final("base64url");
        const authTag = cipher.getAuthTag();
        
        // Retorna: iv:authTag:encrypted
        return `${iv.toString("base64url")}:${authTag.toString("base64url")}:${encrypted}`;
    }

    /**
     * Descriptografa dados sensíveis usando chave do KMS
     */
    async decryptSensitiveData(encryptedData: string, keyId: string): Promise<string> {
        const key = await this.getOrCreateKey(keyId);
        const [ivStr, authTagStr, encrypted] = encryptedData.split(":");
        
        const iv = Buffer.from(ivStr, "base64url");
        const authTag = Buffer.from(authTagStr, "base64url");
        
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, "base64url", "utf8");
        decrypted += decipher.final("utf8");
        
        return decrypted;
    }

    private async getOrCreateKey(keyId: string): Promise<Buffer> {
        if (this.keyStore.has(keyId)) {
            return this.keyStore.get(keyId)!;
        }
        
        const {plaintext} = await this.generateDataKey(keyId);
        return plaintext;
    }

    private encryptKey(key: Buffer): Buffer {
        // Simula criptografia com master key (em produção, KMS faria)
        const iv = randomBytes(12);
        const cipher = createCipheriv("aes-256-gcm", this.masterKey, iv);
        let encrypted = cipher.update(key);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        // Retorna: iv + authTag + encrypted
        return Buffer.concat([iv, authTag, encrypted]);
    }

    private decryptKey(encrypted: Buffer): Buffer {
        // Simula descriptografia com master key (em produção, KMS faria)
        const iv = encrypted.slice(0, 12);
        const authTag = encrypted.slice(12, 28);
        const ciphertext = encrypted.slice(28);
        
        const decipher = createDecipheriv("aes-256-gcm", this.masterKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    }
}

