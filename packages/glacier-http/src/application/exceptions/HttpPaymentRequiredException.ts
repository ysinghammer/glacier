import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpPaymentRequiredException extends HttpException {
  constructor(message = 'Payment Required') {
    super(HttpStatusCode.PAYMENT_REQUIRED, message);
    this.name = 'HttpPaymentRequiredException';
  }
}
