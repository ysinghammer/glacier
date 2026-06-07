import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpMethodNotAllowedException extends HttpException {
  constructor(message = 'Method Not Allowed') {
    super(HttpStatusCode.METHOD_NOT_ALLOWED, message);
    this.name = 'HttpMethodNotAllowedException';
  }
}
