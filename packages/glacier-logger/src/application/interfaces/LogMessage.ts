import type { LogLevel } from './LogLevel';

export interface LogMessage<T> {
  context: string;
  contextId?: string;
  level: LogLevel;
  message: T;
}
