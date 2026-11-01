import type { IFlushable } from "./types/IFlushable.js";
import type { IProcessEvent } from "./types/IProcessEvent.js";
import type { IProcessSignal } from "./types/IProcessSignal.js";
import type { IProcessHost } from "./ports/outbound/IProcessHost.port.js";

/** Shares one guard per host; flushes pending writers on exit and restores unclaimed signals. */
export class ExitFlushGuard {
  /** Reuses one guard per host without keeping hosts alive. */
  private static readonly guards = new WeakMap<IProcessHost, ExitFlushGuard>();

  /** Process event host whose listeners are managed by this guard. */
  private readonly host: IProcessHost;
  /** Writers with work that still requires delivery. */
  private readonly watched = new Set<IFlushable>();
  /** Stable event/listener pairs used for attachment and removal. */
  private readonly listeners: readonly (readonly [IProcessEvent, () => void])[];
  /** Whether the listener pairs are currently registered on the host. */
  private isAttached = false;

  /** Creates an unattached guard for a process host.
   * @param host Process event and signal operations used by the guard.
   */
  private constructor(host: IProcessHost) {
    this.host = host;
    this.listeners = [
      [
        "beforeExit",
        () => {
          // flushAll never rejects: writers report delivery failures instead of throwing them.
          void this.flushAll();
        },
      ],
      ["SIGINT", this.signalListener("SIGINT")],
      ["SIGTERM", this.signalListener("SIGTERM")],
    ];
  }

  /** Gets or creates the guard shared by transports using a host.
   * @param host Process event host to manage.
   * @returns Existing guard for the host, or a newly created guard.
   */
  public static for(host: IProcessHost): ExitFlushGuard {
    const existing = ExitFlushGuard.guards.get(host);
    if (existing !== undefined) {
      return existing;
    }
    const created = new ExitFlushGuard(host);
    ExitFlushGuard.guards.set(host, created);
    return created;
  }

  /** Watches a writer and attaches process listeners when work first becomes pending.
   * @param flushable Writer whose accepted work must be drained at exit.
   * @returns No value; duplicate watches do not duplicate listeners.
   */
  public watch(flushable: IFlushable): void {
    this.watched.add(flushable);
    if (!this.isAttached) {
      this.attach();
    }
  }

  /** Stops watching a writer and detaches listeners when the set becomes empty.
   * @param flushable Writer no longer requiring exit flushing.
   * @returns No value; other watched writers remain registered.
   */
  public release(flushable: IFlushable): void {
    this.watched.delete(flushable);
    if (this.watched.size === 0) {
      this.detach();
    }
  }

  /** Builds the callback that flushes pending writers for one termination signal.
   * @param signal Signal associated with the callback.
   * @returns Listener that drains writers and then restores signal termination.
   */
  private signalListener(signal: IProcessSignal): () => void {
    return () => {
      void this.flushThenRaise(signal);
    };
  }

  /** Flushes all writers currently in the watched set.
   * @returns Promise resolves after all writers flush; rejects if a writer rejects.
   */
  private async flushAll(): Promise<void> {
    await Promise.all([...this.watched].map((flushable) => flushable.flush()));
  }

  /** Drains writers, detaches listeners, and re-raises an unclaimed signal.
   * @param signal Termination signal whose default behavior must be restored.
   * @returns Promise resolves after flushing and signal handling; rejects if either fails.
   */
  private async flushThenRaise(signal: IProcessSignal): Promise<void> {
    await this.flushAll();
    this.detach();
    // Another listener owns the signal's behaviour; only raise it again when nobody else does.
    if (this.host.listenerCount(signal) === 0) {
      this.host.kill(this.host.pid, signal);
    }
  }

  /** Registers all configured process event listeners.
   * @returns No value; marks this guard attached after registration.
   */
  private attach(): void {
    for (const [event, listener] of this.listeners) {
      this.host.on(event, listener);
    }
    this.isAttached = true;
  }

  /** Removes registered event listeners if currently attached.
   * @returns No value; repeated calls leave the host unchanged.
   */
  private detach(): void {
    if (!this.isAttached) {
      return;
    }
    for (const [event, listener] of this.listeners) {
      this.host.off(event, listener);
    }
    this.isAttached = false;
  }
}
