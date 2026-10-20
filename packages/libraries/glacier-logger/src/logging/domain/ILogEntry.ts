import type { ILogLevel } from "./ILogLevel.js";

/** Normalised log record handed to formatters and transports. Never mutate it. */
export interface ILogEntry {
  readonly level: ILogLevel;
  readonly time: Date;
  readonly context: string;
  /** The call message, or the error message when the call carried only an error. */
  readonly message: string;
  /** Factory bindings merged with child bindings, later layers winning. */
  readonly bindings: Readonly<Record<string, unknown>>;
  /** Call fields with every reserved key removed. */
  readonly fields: Readonly<Record<string, unknown>>;
  readonly error?: Error;
}
