import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUnsupportedMediaTypeException extends HttpException {
  constructor(message = 'Unsupported Media Type') {
    super(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE, message);
    this.name = 'HttpUnsupportedMediaTypeException';
  }
}
