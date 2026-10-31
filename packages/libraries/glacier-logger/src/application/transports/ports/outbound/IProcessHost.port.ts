import type { IOutputStream } from "../../types/IOutputStream.js";
import type { IProcessEvent } from "../../types/IProcessEvent.js";
import type { IProcessSignal } from "../../types/IProcessSignal.js";

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
