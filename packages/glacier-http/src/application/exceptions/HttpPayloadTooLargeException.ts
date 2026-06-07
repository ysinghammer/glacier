import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpPayloadTooLargeException extends HttpException {
  constructor(message = 'Payload Too Large') {
    super(HttpStatusCode.PAYLOAD_TOO_LARGE, message);
    this.name = 'HttpPayloadTooLargeException';
  }
}
