import type { IFlushable } from "./types/IFlushable.js";
import type { IProcessEvent } from "./types/IProcessEvent.js";
import type { IProcessSignal } from "./types/IProcessSignal.js";
import type { IProcessHost } from "./ports/outbound/IProcessHost.port.js";

/**
 * Flushes watched writers when the process is about to end: on `beforeExit`, and on `SIGINT` and
 * `SIGTERM`, where it flushes and then restores the default behaviour by re-raising the signal so
 * the process still terminates. There is one guard per process host, so handlers are registered
 * once however many transports exist. They are registered only while a writer has pending work and
 * removed again as soon as none has, so they never keep the process alive.
 */
export class ExitFlushGuard {
  private static readonly guards = new WeakMap<IProcessHost, ExitFlushGuard>();

  private readonly host: IProcessHost;
  private readonly watched = new Set<IFlushable>();
  private readonly listeners: readonly (readonly [IProcessEvent, () => void])[];
  private isAttached = false;

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

  /** Returns the guard shared by every transport on `host`. */
  public static for(host: IProcessHost): ExitFlushGuard {
    const existing = ExitFlushGuard.guards.get(host);
    if (existing !== undefined) {
      return existing;
    }
    const created = new ExitFlushGuard(host);
    ExitFlushGuard.guards.set(host, created);
    return created;
  }

  /** Starts flushing `flushable` at exit, registering the process handlers when first needed. */
  public watch(flushable: IFlushable): void {
    this.watched.add(flushable);
    if (!this.isAttached) {
      this.attach();
    }
  }

  /** Stops watching `flushable`, removing the process handlers when nothing is watched any more. */
  public release(flushable: IFlushable): void {
    this.watched.delete(flushable);
    if (this.watched.size === 0) {
      this.detach();
    }
  }

  private signalListener(signal: IProcessSignal): () => void {
    return () => {
      void this.flushThenRaise(signal);
    };
  }

  private async flushAll(): Promise<void> {
    await Promise.all([...this.watched].map((flushable) => flushable.flush()));
  }

  private async flushThenRaise(signal: IProcessSignal): Promise<void> {
    await this.flushAll();
    this.detach();
    // Another listener owns the signal's behaviour; only raise it again when nobody else does.
    if (this.host.listenerCount(signal) === 0) {
      this.host.kill(this.host.pid, signal);
    }
  }

  private attach(): void {
    for (const [event, listener] of this.listeners) {
      this.host.on(event, listener);
    }
    this.isAttached = true;
  }

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
