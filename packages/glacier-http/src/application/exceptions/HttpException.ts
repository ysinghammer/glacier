import type { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpException extends Error {
  public readonly statusCode: HttpStatusCode;

  public constructor(statusCode: HttpStatusCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpException';
  }
}
