import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpBadGatewayException extends HttpException {
  constructor(message = 'Bad Gateway') {
    super(HttpStatusCode.BAD_GATEWAY, message);
    this.name = 'HttpBadGatewayException';
  }
}
