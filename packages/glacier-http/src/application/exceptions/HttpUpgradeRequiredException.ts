import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpUpgradeRequiredException extends HttpException {
  constructor(message = 'Upgrade Required') {
    super(HttpStatusCode.UPGRADE_REQUIRED, message);
    this.name = 'HttpUpgradeRequiredException';
  }
}
