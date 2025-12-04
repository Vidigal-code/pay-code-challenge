import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JWKSService } from "@infrastructure/auth/jwks.service";

@ApiTags("security")
@Controller(".well-known")
export class JWKSController {
  constructor(private readonly jwksService: JWKSService) {}

  @Get("jwks.json")
  @ApiOperation({
    summary: "JSON Web Key Set (JWKS) endpoint for key rotation",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the JSON Web Key Set",
    schema: {
      type: "object",
      properties: {
        keys: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kty: { type: "string", example: "oct" },
              use: { type: "string", example: "enc" },
              kid: { type: "string", example: "abc123" },
              alg: { type: "string", example: "A256GCM" },
              k: { type: "string", example: "base64url-encoded-key" },
            },
          },
        },
      },
    },
  })
  async getJWKS() {
    return await this.jwksService.getJWKS();
  }
}
