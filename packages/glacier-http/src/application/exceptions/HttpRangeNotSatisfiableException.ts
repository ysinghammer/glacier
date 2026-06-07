import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpRangeNotSatisfiableException extends HttpException {
  constructor(message = 'Range Not Satisfiable') {
    super(HttpStatusCode.RANGE_NOT_SATISFIABLE, message);
    this.name = 'HttpRangeNotSatisfiableException';
  }
}
