import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUriTooLongException extends HttpException {
  constructor(message = 'URI Too Long') {
    super(HttpStatusCode.URI_TOO_LONG, message);
    this.name = 'HttpUriTooLongException';
  }
}
