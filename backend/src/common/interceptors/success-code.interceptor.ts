import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SuccessCode } from "@application/success/success-code";

@Injectable()
export class SuccessCodeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.route?.path || request.url;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === "object" && "code" in data) {
          return data;
        }

        if (data === null || data === undefined) {
          const successCode = this.determineSuccessCode(method, path);
          return {
            success: true,
            code: successCode,
          };
        }

        const successCode = this.determineSuccessCode(method, path);

        if (typeof data === "object" && !Array.isArray(data)) {
          return {
            ...data,
            success: true,
            code: successCode,
          };
        }

        return {
          success: true,
          code: successCode,
          data,
        };
      }),
    );
  }

  private determineSuccessCode(method: string, path: string): SuccessCode {
    if (method === "POST") {
      if (path.includes("/auth/signup")) {
        return SuccessCode.USER_CREATED;
      }
      if (path.includes("/auth/login")) {
        return SuccessCode.USER_AUTHENTICATED;
      }
      if (path.includes("/wallet") && !path.includes("/transactions")) {
        return SuccessCode.WALLET_CREATED;
      }
      if (path.includes("/deposit")) {
        return SuccessCode.DEPOSIT_COMPLETED;
      }
      if (path.includes("/transfer")) {
        return SuccessCode.TRANSFER_COMPLETED;
      }
      if (path.includes("/reverse")) {
        return SuccessCode.TRANSACTION_REVERSED;
      }
      if (path.includes("/profile")) {
        return SuccessCode.PROFILE_UPDATED;
      }
      return SuccessCode.OPERATION_SUCCESS;
    }

    if (method === "PUT" || method === "PATCH") {
      if (path.includes("/profile")) {
        return SuccessCode.PROFILE_UPDATED;
      }
      return SuccessCode.OPERATION_SUCCESS;
    }

    if (method === "DELETE") {
      if (path.includes("/account")) {
        return SuccessCode.ACCOUNT_DELETED;
      }
      return SuccessCode.OPERATION_SUCCESS;
    }

    return SuccessCode.OPERATION_SUCCESS;
  }
}
