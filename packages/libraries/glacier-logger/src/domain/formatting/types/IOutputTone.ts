import type { ILogLevel } from "../../logging/types/ILogLevel.js";

/** Pretty-output emphasis: one log-level tone or `subdued` for secondary text. */
export type IOutputTone = ILogLevel | "subdued";
