import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable') {
    super(HttpStatusCode.SERVICE_UNAVAILABLE, message);
    this.name = 'HttpServiceUnavailableException';
  }
}
