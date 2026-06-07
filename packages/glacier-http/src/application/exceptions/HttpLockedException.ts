import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpLockedException extends HttpException {
  constructor(message = 'Locked') {
    super(HttpStatusCode.LOCKED, message);
    this.name = 'HttpLockedException';
  }
}
