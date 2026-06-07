import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(HttpStatusCode.UNAUTHORIZED, message);
    this.name = 'HttpUnauthorizedException';
  }
}
