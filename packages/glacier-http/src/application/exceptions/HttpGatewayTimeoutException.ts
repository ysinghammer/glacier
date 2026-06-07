import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpGatewayTimeoutException extends HttpException {
  constructor(message = 'Gateway Timeout') {
    super(HttpStatusCode.GATEWAY_TIMEOUT, message);
    this.name = 'HttpGatewayTimeoutException';
  }
}
