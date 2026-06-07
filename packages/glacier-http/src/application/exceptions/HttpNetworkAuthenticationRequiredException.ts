import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpNetworkAuthenticationRequiredException extends HttpException {
  constructor(message = 'Network Authentication Required') {
    super(HttpStatusCode.NETWORK_AUTHENTICATION_REQUIRED, message);
    this.name = 'HttpNetworkAuthenticationRequiredException';
  }
}
