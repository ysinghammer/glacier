import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpGoneException extends HttpException {
  constructor(message = 'Gone') {
    super(HttpStatusCode.GONE, message);
    this.name = 'HttpGoneException';
  }
}
