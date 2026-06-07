import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpHTTPVersionNotSupportedException extends HttpException {
  constructor(message = 'HTTP Version Not Supported') {
    super(HttpStatusCode.HTTP_VERSION_NOT_SUPPORTED, message);
    this.name = 'HttpHTTPVersionNotSupportedException';
  }
}
