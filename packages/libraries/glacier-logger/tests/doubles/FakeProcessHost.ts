import type { IProcessEvent, IProcessHost, IProcessSignal } from "../../index.js";
import { RecordingOutputStream } from "./RecordingOutputStream.js";

/** Test-owned process: records listeners and signals, and lets a test raise events itself. */
export class FakeProcessHost implements IProcessHost {
  readonly pid = 4242;
  readonly stdout = new RecordingOutputStream();
  readonly raised: IProcessSignal[] = [];
  readonly #listeners = new Map<IProcessEvent, (() => void)[]>();

  on(event: IProcessEvent, listener: () => void): void {
    this.#listeners.set(event, [...(this.#listeners.get(event) ?? []), listener]);
  }

  off(event: IProcessEvent, listener: () => void): void {
    this.#listeners.set(
      event,
      (this.#listeners.get(event) ?? []).filter((candidate) => candidate !== listener),
    );
  }

  listenerCount(event: IProcessEvent): number {
    return this.#listeners.get(event)?.length ?? 0;
  }

  kill(pid: number, signal: IProcessSignal): void {
    if (pid === this.pid) {
      this.raised.push(signal);
    }
  }

  /** Calls every listener of `event`, as the runtime would. */
  emit(event: IProcessEvent): void {
    for (const listener of this.#listeners.get(event) ?? []) {
      listener();
    }
  }
}
