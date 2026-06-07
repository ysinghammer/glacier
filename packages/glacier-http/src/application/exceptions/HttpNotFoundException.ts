import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpNotFoundException extends HttpException {
  constructor(message = 'Not Found') {
    super(HttpStatusCode.NOT_FOUND, message);
    this.name = 'HttpNotFoundException';
  }
}
