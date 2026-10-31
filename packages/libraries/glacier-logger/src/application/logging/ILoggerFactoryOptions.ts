/** Optional settings for `LoggerFactory.createLogger`. */
export interface ILoggerFactoryOptions {
  /** Merged over the factory bindings. Keys must be non-empty and not reserved. */
  readonly bindings?: Readonly<Record<string, unknown>>;
}
