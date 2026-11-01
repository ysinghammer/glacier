/** Per-logger settings supplied to `LoggerFactory.createLogger`. */
export interface ILoggerFactoryOptions {
  /** Bindings overlaid on factory bindings; omitted to add no fields. */
  readonly bindings?: Readonly<Record<string, unknown>>;
}
