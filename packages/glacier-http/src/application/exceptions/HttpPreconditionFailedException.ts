import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpPreconditionFailedException extends HttpException {
  constructor(message = 'Precondition Failed') {
    super(HttpStatusCode.PRECONDITION_FAILED, message);
    this.name = 'HttpPreconditionFailedException';
  }
}
