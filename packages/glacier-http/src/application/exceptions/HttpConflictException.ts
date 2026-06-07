import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(HttpStatusCode.CONFLICT, message);
    this.name = 'HttpConflictException';
  }
}
