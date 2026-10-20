import type { IOutputStream } from "../../IOutputStream.js";
import type { IProcessEvent } from "../../IProcessEvent.js";
import type { IProcessSignal } from "../../IProcessSignal.js";

/** The slice of the Node `process` object that buffered transports use. */
export interface IProcessHost {
  readonly pid: number;
  readonly stdout: IOutputStream;
  on(event: IProcessEvent, listener: () => void): unknown;
  off(event: IProcessEvent, listener: () => void): unknown;
  listenerCount(event: IProcessEvent): number;
  /** Sends `signal` to the process `pid`. */
  kill(pid: number, signal: IProcessSignal): unknown;
}
