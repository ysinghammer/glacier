import type { IProcessEvent, IProcessHost, IProcessSignal } from "../../index.js";
import { RecordingOutputStream } from "./RecordingOutputStream.js";

/** Supplies a deterministic process host whose listeners, output, and raised signals are observable to tests. */
export class FakeProcessHost implements IProcessHost {
  /**
   * Readonly synthetic process identifier used to match simulated kill requests.
   * @default 4242
   */
  public readonly pid = 4242;
  /**
   * Readonly stream reference capturing transport output for this host.
   * @default A new {@link RecordingOutputStream}
   */
  public readonly stdout = new RecordingOutputStream();
  /**
   * Readonly array reference of signals re-raised by matching kill requests, in order.
   * @default An empty array
   */
  public readonly raised: IProcessSignal[] = [];
  /**
   * Readonly map reference of mutable listener lists grouped by process event.
   * @default An empty map
   */
  private readonly listeners = new Map<IProcessEvent, (() => void)[]>();

  /**
   * Registers a listener so tests can inspect its count or emit the event.
   * @param event Process event whose listener is being registered.
   * @param listener Callback retained and invoked when the event is emitted.
   * @returns No value; stores the listener for later event delivery.
   */
  public on(event: IProcessEvent, listener: () => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
  }

  /**
   * Removes the matching listener while preserving other listeners for the event.
   * @param event Process event from which the listener is removed.
   * @param listener Previously registered callback to remove by identity.
   * @returns No value; updates the stored listener list.
   */
  public off(event: IProcessEvent, listener: () => void): void {
    this.listeners.set(
      event,
      (this.listeners.get(event) ?? []).filter((candidate) => candidate !== listener),
    );
  }

  /**
   * Counts currently registered listeners for an event.
   * @param event Process event whose listeners are counted.
   * @returns Number of registered callbacks, or zero when none exist.
   */
  public listenerCount(event: IProcessEvent): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Records a signal only when the requested process identifier matches this host.
   * @param pid Process identifier targeted by the simulated signal.
   * @param signal Signal to append when the target is this host.
   * @returns No value; matching signals are added to {@link raised}.
   */
  public kill(pid: number, signal: IProcessSignal): void {
    if (pid === this.pid) {
      this.raised.push(signal);
    }
  }

  /**
   * Delivers an event to a snapshot of its currently registered listeners.
   * @param event Process event to deliver.
   * @returns No value; invokes each listener registered at delivery start.
   */
  public emit(event: IProcessEvent): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }
}
