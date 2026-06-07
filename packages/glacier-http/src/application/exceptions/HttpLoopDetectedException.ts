import { HttpException } from './HttpException';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

export class HttpLoopDetectedException extends HttpException {
  constructor(message = 'Loop Detected') {
    super(HttpStatusCode.LOOP_DETECTED, message);
    this.name = 'HttpLoopDetectedException';
  }
}
