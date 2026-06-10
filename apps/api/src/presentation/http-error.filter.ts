import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { HabitNotFoundError, PersistenceError, UnauthorizedDeviceError, ValidationError } from "../domain/errors";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(error);
    response.status(status).json({
      statusCode: status,
      error: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? error.message : "Unexpected error."
    });
  }

  private statusFor(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    if (error instanceof ValidationError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (error instanceof HabitNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (error instanceof UnauthorizedDeviceError) {
      return HttpStatus.FORBIDDEN;
    }
    if (error instanceof PersistenceError) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
