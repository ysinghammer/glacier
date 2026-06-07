import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpTooEarlyException extends HttpException {
  constructor(message = 'Too Early') {
    super(HttpStatusCode.TOO_EARLY, message);
    this.name = 'HttpTooEarlyException';
  }
}
