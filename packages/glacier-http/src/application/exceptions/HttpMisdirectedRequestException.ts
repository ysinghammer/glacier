import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpMisdirectedRequestException extends HttpException {
  constructor(message = 'Misdirected Request') {
    super(HttpStatusCode.MISDIRECTED_REQUEST, message);
    this.name = 'HttpMisdirectedRequestException';
  }
}
