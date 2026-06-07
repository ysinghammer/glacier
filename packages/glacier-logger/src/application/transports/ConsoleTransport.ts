import { stdout } from 'node:process';

import { LogTransport } from '../entities/LogTransport';
import { LogLevel } from '../interfaces/LogLevel';

import type { LogMessage } from '../interfaces/LogMessage';

export class ConsoleTransport extends LogTransport<{ message: string }> {
  public log(message: LogMessage<{ message: string }>): void {
    const currentTime = new Date().toISOString();
    const logLevel = this.getColoredLevel(message.level);
    const context = this.getColoredContext(message.context);
    const contextId = message.contextId;
    const logMessage = message.message.message;
    const formatted = [
      currentTime,
      logLevel,
      contextId ? this.colorize('34', contextId) : '        ',
      '---',
      context,
      logMessage + '\n'
    ]
      .filter(Boolean)
      .join(' ');
    stdout.write(formatted);
  }

  private getColoredContext(context: string): string {
    return '[' + this.colorize('36', this.padToLength(context, 25)) + ']';
  }

  private getColoredLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: {
        return this.colorize('35', 'DEBUG');
      }
      case LogLevel.INFO: {
        return this.colorize('32', 'INFO ');
      }
      case LogLevel.WARNING: {
        return this.colorize('33', 'WARN ');
      }
      case LogLevel.ERROR: {
        return this.colorize('31', 'ERROR');
      }
    }
  }

  private colorize(color: string, text: string): string {
    return `\u001B[${color}m${text}\u001B[0m`;
  }

  private padToLength(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }
}
