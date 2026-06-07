import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpNotExtendedException extends HttpException {
  constructor(message = 'Not Extended') {
    super(HttpStatusCode.NOT_EXTENDED, message);
    this.name = 'HttpNotExtendedException';
  }
}
