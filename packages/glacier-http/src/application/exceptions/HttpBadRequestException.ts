import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpBadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(HttpStatusCode.BAD_REQUEST, message);
    this.name = 'HttpBadRequestException';
  }
}
