import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpNotAcceptableException extends HttpException {
  constructor(message = 'Not Acceptable') {
    super(HttpStatusCode.NOT_ACCEPTABLE, message);
    this.name = 'HttpNotAcceptableException';
  }
}
