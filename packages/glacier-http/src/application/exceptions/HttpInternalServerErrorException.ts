import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpInternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error') {
    super(HttpStatusCode.INTERNAL_SERVER_ERROR, message);
    this.name = 'HttpInternalServerErrorException';
  }
}
