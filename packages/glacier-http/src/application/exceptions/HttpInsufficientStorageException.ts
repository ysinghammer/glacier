import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpInsufficientStorageException extends HttpException {
  constructor(message = 'Insufficient Storage') {
    super(HttpStatusCode.INSUFFICIENT_STORAGE, message);
    this.name = 'HttpInsufficientStorageException';
  }
}
