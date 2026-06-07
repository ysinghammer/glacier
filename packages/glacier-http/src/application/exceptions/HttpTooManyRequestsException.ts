import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpTooManyRequestsException extends HttpException {
  constructor(message = 'Too Many Requests') {
    super(HttpStatusCode.TOO_MANY_REQUESTS, message);
    this.name = 'HttpTooManyRequestsException';
  }
}
