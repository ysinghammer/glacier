import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ExceptionFilter,
  Catch,
  HttpException,
  NotFoundException
} from '@nestjs/common';
import { Response } from 'express';

import { UserNotFoundException } from '../../domain/shared/exceptions/UserNotFoundException.js';
import { UserAlreadyExistsException } from '../../domain/shared/exceptions/UserAlreadyExistsException.js';
import { InvalidUserDataException } from '../../domain/shared/exceptions/InvalidUserDataException.js';
import { DomainException } from '../../../../shared/kernel/index.js';

/**
 * NestJS exception filter that translates domain exceptions into HTTP responses.
 *
 * This filter intercepts domain-level exceptions (which are framework-agnostic)
 * and maps them to appropriate HTTP status codes and error response bodies.
 * This separation ensures the application layer remains independent of HTTP semantics.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Map domain exceptions to appropriate HTTP exceptions
    let httpException: HttpException;

    if (exception instanceof UserNotFoundException) {
      httpException = new NotFoundException(exception.message);
    } else if (exception instanceof UserAlreadyExistsException) {
      httpException = new ConflictException(exception.message);
    } else if (exception instanceof InvalidUserDataException) {
      httpException = new BadRequestException(exception.message);
    } else {
      // Generic domain exception → 400 Bad Request
      httpException = new BadRequestException(exception.message);
    }

    // Forward to NestJS's built-in HTTP exception handler
    const httpExceptionResponse = httpException.getResponse();
    const httpExceptionStatus = httpException.getStatus();

    response.status(httpExceptionStatus).json(httpExceptionResponse);
  }
}
