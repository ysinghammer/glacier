import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpExpectationFailedException extends HttpException {
  constructor(message = 'Expectation Failed') {
    super(HttpStatusCode.EXPECTATION_FAILED, message);
    this.name = 'HttpExpectationFailedException';
  }
}
