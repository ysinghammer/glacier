import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUnavailableForLegalReasonsException extends HttpException {
  constructor(message = 'Unavailable For Legal Reasons') {
    super(HttpStatusCode.UNAVAILABLE_FOR_LEGAL_REASONS, message);
    this.name = 'HttpUnavailableForLegalReasonsException';
  }
}
