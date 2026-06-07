// Reserved status codes
import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpVariantAlsoNegotiatesException extends HttpException {
  constructor(message = 'Variant Also Negotiates') {
    super(HttpStatusCode.VARIANT_ALSO_NEGOTIATES, message);
    this.name = 'HttpVariantAlsoNegotiatesException';
  }
}
