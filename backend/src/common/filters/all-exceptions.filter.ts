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
      code = typeof exception.code === "string" ? exception.code : String(exception.code);
      this.logger.warn(`ApplicationError [${code}]: ${message} - Path: ${request.method} ${request.url}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message[0] || "Validation failed";
          code = "VALIDATION_ERROR";
          this.logger.warn(`ValidationError: ${JSON.stringify(responseObj.message)} - Path: ${request.method} ${request.url} - Body: ${JSON.stringify(request.body)}`);
        } else if (responseObj.message) {
          message = responseObj.message;
          code = responseObj.error || "HTTP_ERROR";
          this.logger.warn(`HttpException [${code}]: ${message} - Path: ${request.method} ${request.url}`);
        } else {
          message = "Request validation failed";
          code = "VALIDATION_ERROR";
          this.logger.warn(`ValidationError: Request validation failed - Path: ${request.method} ${request.url}`);
        }
      } else {
        message = exceptionResponse;
        code = "HTTP_ERROR";
        this.logger.warn(`HttpException: ${message} - Path: ${request.method} ${request.url}`);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = {
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 400 && status < 500) {
      this.logger.warn(`Bad Request [${status}]: ${JSON.stringify(errorResponse)}`);
      if (request.body) {
        this.logger.debug(`Request body: ${JSON.stringify(request.body)}`);
      }
      if (request.query && Object.keys(request.query).length > 0) {
        this.logger.debug(`Request query: ${JSON.stringify(request.query)}`);
      }
    } else if (status >= 500) {
      this.logger.error(`Internal Server Error [${status}]: ${JSON.stringify(errorResponse)}`);
    }

    response.status(status).json(errorResponse);
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
