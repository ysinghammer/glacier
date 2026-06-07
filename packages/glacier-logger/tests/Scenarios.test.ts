import { stdout } from 'node:process';

import { globalContext } from '@glacier/context';

import { fakeLogger } from './fakes/fakeLogger';
import { LogLevel } from '../src';

describe('@glacier/logger Scenarios', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test('Scenario 1: should log a simple message', () => {
    const logger = fakeLogger();
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.info({ message: '{{MESSAGE}}' });
    expect(spy).toHaveBeenCalledWith(
      '2026-01-01T00:00:00.000Z [32mINFO [0m          --- [[36m{{CONTEXT}}              [0m] {{MESSAGE}}\n'
    );
  });

  test('Scenario 2: should log the current context id', () => {
    const logger = fakeLogger();
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.spyOn(globalContext, 'getId').mockReturnValue('e40a9205');
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));

    globalContext.run(() => {
      logger.info({ message: '{{MESSAGE}}' });
      expect(spy).toHaveBeenCalledWith(
        '2026-01-01T00:00:00.000Z [32mINFO [0m [34me40a9205[0m --- [[36m{{CONTEXT}}              [0m] {{MESSAGE}}\n'
      );
    });
  });

  test('Scenario 3: should log debug messages correctly', () => {
    const logger = fakeLogger();
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.debug({ message: '{{MESSAGE}}' });
    expect(spy).toHaveBeenCalledWith(
      '2026-01-01T00:00:00.000Z [35mDEBUG[0m          --- [[36m{{CONTEXT}}              [0m] {{MESSAGE}}\n'
    );
  });

  test('Scenario 4: should log error messages correctly', () => {
    const logger = fakeLogger();
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.error({ message: '{{MESSAGE}}' });
    expect(spy).toHaveBeenCalledWith(
      '2026-01-01T00:00:00.000Z [31mERROR[0m          --- [[36m{{CONTEXT}}              [0m] {{MESSAGE}}\n'
    );
  });

  test('Scenario 5: should log warning messages correctly', () => {
    const logger = fakeLogger();
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.warn({ message: '{{MESSAGE}}' });
    expect(spy).toHaveBeenCalledWith(
      '2026-01-01T00:00:00.000Z [33mWARN [0m          --- [[36m{{CONTEXT}}              [0m] {{MESSAGE}}\n'
    );
  });

  test('Scenario 6: should not log debug if level is set to info', () => {
    const logger = fakeLogger(LogLevel.INFO);
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.debug({ message: '{{MESSAGE}}' });
    logger.info({ message: '{{MESSAGE}}' });
    logger.warn({ message: '{{MESSAGE}}' });
    logger.error({ message: '{{MESSAGE}}' });
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
  });

  test('Scenario 7: should not log debug and info if level is set to warn', () => {
    const logger = fakeLogger(LogLevel.WARNING);
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.debug({ message: '{{MESSAGE}}' });
    logger.info({ message: '{{MESSAGE}}' });
    logger.warn({ message: '{{MESSAGE}}' });
    logger.error({ message: '{{MESSAGE}}' });
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('INFO'));
  });

  test('Scenario 7: should only log errors if LogLevel is set to error', () => {
    const logger = fakeLogger(LogLevel.ERROR);
    const spy = jest.spyOn(stdout, 'write').mockImplementation();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01'));
    logger.debug({ message: '{{MESSAGE}}' });
    logger.info({ message: '{{MESSAGE}}' });
    logger.warn({ message: '{{MESSAGE}}' });
    logger.error({ message: '{{MESSAGE}}' });
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('INFO'));
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('WARN'));
  });
});
