import { globalContext } from '@glacier/context';

import { LogLevel } from './interfaces/LogLevel';

import type { LogConfig } from './interfaces/LogConfig';

export class Logger<V, M> {
  public constructor(
    private readonly context: string,
    private readonly config: LogConfig<V, M>
  ) {}

  public debug(message: V): void {
    if (this.config.level > LogLevel.DEBUG) return;
    this.log(LogLevel.DEBUG, message);
  }

  public info(message: V): void {
    if (this.config.level > LogLevel.INFO) return;
    this.log(LogLevel.INFO, message);
  }

  public warn(message: V): void {
    if (this.config.level > LogLevel.WARNING) return;
    this.log(LogLevel.WARNING, message);
  }

  public error(message: V): void {
    this.log(LogLevel.ERROR, message);
  }

  private log(level: LogLevel, message: V): void {
    for (const transport of this.config.transports) {
      void transport.log({
        message: { ...this.config.defaultMeta, ...message },
        context: this.context,
        contextId: globalContext.getId(),
        level
      });
    }
  }
}
