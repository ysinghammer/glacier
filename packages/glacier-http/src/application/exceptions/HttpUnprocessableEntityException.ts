import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity') {
    super(HttpStatusCode.UNPROCESSABLE_ENTITY, message);
    this.name = 'HttpUnprocessableEntityException';
  }
}
