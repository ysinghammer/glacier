import type { IProcessSignal } from "./IProcessSignal.js";

/** Process event names used to trigger buffered transport flushing. */
export type IProcessEvent = "beforeExit" | IProcessSignal;
