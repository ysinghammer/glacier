import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpImATeapotException extends HttpException {
  constructor(message = "I'm a teapot") {
    super(HttpStatusCode.I_AM_A_TEAPOT, message);
    this.name = 'HttpImATeapotException';
  }
}
