import type { ILogCall } from "./ILogCall.js";
import type { ILogLevel } from "./ILogLevel.js";

/** Everything needed to normalise one log call into an entry. */
export interface ILogEntryInput {
  readonly level: ILogLevel;
  readonly time: Date;
  readonly context: string;
  readonly bindings: Readonly<Record<string, unknown>>;
  readonly call: ILogCall;
}
