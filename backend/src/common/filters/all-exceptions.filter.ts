import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ApplicationError } from "@application/errors/application-error";
import { ErrorCode } from "@application/errors/error-code";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = "INTERNAL_ERROR";

    if (exception instanceof ApplicationError) {
      status = this.mapApplicationErrorToStatus(exception.code);
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message;
      code =
        typeof exceptionResponse === "object" &&
        (exceptionResponse as any).error
          ? (exceptionResponse as any).error
          : "HTTP_ERROR";
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapApplicationErrorToStatus(code: string): number {
    const errorMap: Record<string, number> = {
      // Validation errors
      [ErrorCode.NO_FIELDS_TO_UPDATE]: HttpStatus.BAD_REQUEST,
      [ErrorCode.CURRENT_PASSWORD_REQUIRED]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_EMAIL]: HttpStatus.BAD_REQUEST,
      [ErrorCode.MISSING_USER_DATA]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_DATE]: HttpStatus.BAD_REQUEST,

      // Authentication & Authorization
      [ErrorCode.USER_NOT_AUTHENTICATED]: HttpStatus.UNAUTHORIZED,
      [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
      [ErrorCode.INVALID_CURRENT_PASSWORD]: HttpStatus.UNAUTHORIZED,
      [ErrorCode.FORBIDDEN_ACTION]: HttpStatus.FORBIDDEN,

      // User errors
      [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.EMAIL_ALREADY_IN_USE]: HttpStatus.CONFLICT,
      [ErrorCode.EMAIL_ALREADY_USED]: HttpStatus.CONFLICT,

      // Wallet errors
      [ErrorCode.WALLET_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.WALLET_ALREADY_EXISTS]: HttpStatus.CONFLICT,
      [ErrorCode.INSUFFICIENT_BALANCE]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_AMOUNT]: HttpStatus.BAD_REQUEST,

      // Transaction errors
      [ErrorCode.TRANSACTION_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.TRANSACTION_CANNOT_BE_REVERSED]: HttpStatus.BAD_REQUEST,
      [ErrorCode.TRANSACTION_ALREADY_REVERSED]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_TRANSACTION_TYPE]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_TRANSACTION_STATUS]: HttpStatus.BAD_REQUEST,
      [ErrorCode.RECEIVER_NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCode.CANNOT_TRANSFER_TO_SELF]: HttpStatus.BAD_REQUEST,
      [ErrorCode.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
    };

    return errorMap[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
