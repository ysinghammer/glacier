import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpRequestHeaderFieldsTooLargeException extends HttpException {
  constructor(message = 'Request Header Fields Too Large') {
    super(HttpStatusCode.REQUEST_HEADER_FIELDS_TOO_LARGE, message);
    this.name = 'HttpRequestHeaderFieldsTooLargeException';
  }
}
