import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpLengthRequiredException extends HttpException {
  constructor(message = 'Length Required') {
    super(HttpStatusCode.LENGTH_REQUIRED, message);
    this.name = 'HttpLengthRequiredException';
  }
}
