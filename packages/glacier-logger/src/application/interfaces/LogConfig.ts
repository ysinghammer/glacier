import type { LogLevel } from './LogLevel';
import type { LogTransport } from '../entities/LogTransport';

export interface LogConfig<V, M> {
  level: LogLevel;
  defaultMeta: M;
  transports: LogTransport<V & M>[];
}
