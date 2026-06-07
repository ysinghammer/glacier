import type { LogMessage } from '../interfaces/LogMessage';

export abstract class LogTransport<T> {
  public abstract log(message: LogMessage<T>): Promise<void> | void;
}
