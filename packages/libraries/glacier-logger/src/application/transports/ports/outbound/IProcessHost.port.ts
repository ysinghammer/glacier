import type { IOutputStream } from "../../types/IOutputStream.js";
import type { IProcessEvent } from "../../types/IProcessEvent.js";
import type { IProcessSignal } from "../../types/IProcessSignal.js";

/** Process capabilities used to manage buffered transport exit behavior. */
export interface IProcessHost {
  /** Process identifier passed back when re-raising a termination signal. */
  readonly pid: number;
  /** Writable standard output stream used by the Node stdout transport. */
  readonly stdout: IOutputStream;
  /** Registers a listener for a supported process event.
   * @param event Event name to observe.
   * @param listener Callback invoked when the event occurs.
   * @returns Host-specific registration result.
   */
  on(event: IProcessEvent, listener: () => void): unknown;
  /** Removes a previously registered event listener.
   * @param event Event name previously observed.
   * @param listener Same callback passed to `on`.
   * @returns Host-specific removal result.
   */
  off(event: IProcessEvent, listener: () => void): unknown;
  /** Counts listeners currently registered for an event.
   * @param event Event to inspect.
   * @returns Number of listeners currently registered.
   */
  listenerCount(event: IProcessEvent): number;
  /** Sends a termination signal to a process.
   * @param pid Process identifier receiving the signal.
   * @param signal Supported termination signal to send.
   * @returns Host-specific signal result.
   */
  kill(pid: number, signal: IProcessSignal): unknown;
}
