import { ConsoleTransport, LogFactory, LogLevel } from '../../src';

export function fakeLogger(level = LogLevel.DEBUG) {
  const consoleTransport = new ConsoleTransport();
  const factory = new LogFactory({
    level,
    defaultMeta: {},
    transports: [consoleTransport]
  });
  return factory.create('{{CONTEXT}}');
}
