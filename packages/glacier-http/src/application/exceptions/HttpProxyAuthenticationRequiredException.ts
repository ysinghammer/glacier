import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpProxyAuthenticationRequiredException extends HttpException {
  constructor(message = 'Proxy Authentication Required') {
    super(HttpStatusCode.PROXY_AUTHENTICATION_REQUIRED, message);
    this.name = 'HttpProxyAuthenticationRequiredException';
  }
}
