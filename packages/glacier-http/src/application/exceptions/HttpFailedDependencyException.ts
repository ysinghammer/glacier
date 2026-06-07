import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpFailedDependencyException extends HttpException {
  constructor(message = 'Failed Dependency') {
    super(HttpStatusCode.FAILED_DEPENDENCY, message);
    this.name = 'HttpFailedDependencyException';
  }
}
