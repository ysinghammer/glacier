import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(HttpStatusCode.FORBIDDEN, message);
    this.name = 'HttpForbiddenException';
  }
}
