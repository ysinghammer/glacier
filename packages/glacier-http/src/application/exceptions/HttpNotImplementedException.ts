import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpNotImplementedException extends HttpException {
  constructor(message = 'Not Implemented') {
    super(HttpStatusCode.NOT_IMPLEMENTED, message);
    this.name = 'HttpNotImplementedException';
  }
}
