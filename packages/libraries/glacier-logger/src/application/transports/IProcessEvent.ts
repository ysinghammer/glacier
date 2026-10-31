import type { IProcessSignal } from "./IProcessSignal.js";

/** Process events buffered transports listen to: the event loop running dry, or a terminating signal. */
export type IProcessEvent = "beforeExit" | IProcessSignal;
