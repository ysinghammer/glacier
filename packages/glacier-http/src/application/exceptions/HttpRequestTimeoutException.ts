import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpRequestTimeoutException extends HttpException {
  constructor(message = 'Request Timeout') {
    super(HttpStatusCode.REQUEST_TIMEOUT, message);
    this.name = 'HttpRequestTimeoutException';
  }
}
