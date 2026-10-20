import type { ILogLevel } from "../../logging/domain/ILogLevel.js";

/** Visual emphasis of a piece of pretty output: a level colour, or `subdued` for secondary text. */
export type IOutputTone = ILogLevel | "subdued";
