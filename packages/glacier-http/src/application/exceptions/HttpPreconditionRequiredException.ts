import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpPreconditionRequiredException extends HttpException {
  constructor(message = 'Precondition Required') {
    super(HttpStatusCode.PRECONDITION_REQUIRED, message);
    this.name = 'HttpPreconditionRequiredException';
  }
}
