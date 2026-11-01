import type {
  IBeforeContainerShutdown,
  IOnContainerInit,
  IOnContainerShutdown,
  IOnModuleDestroy,
  IOnModuleInit,
} from "../../index.js";

/** Names one of onModuleInit, onContainerInit, onModuleDestroy, beforeContainerShutdown, or onContainerShutdown. */
export type IRecordedHook =
  | "onModuleInit"
  | "onContainerInit"
  | "onModuleDestroy"
  | "beforeContainerShutdown"
  | "onContainerShutdown";

/** Describes a provider value that implements every hook so scenarios can verify container ordering. */
export type IRecordedTarget = IOnModuleInit &
  IOnContainerInit &
  IOnModuleDestroy &
  IBeforeContainerShutdown &
  IOnContainerShutdown;

const HOOK_DELAY_MS = 1;

/** Records lifecycle calls in completion order and can reject selected hooks for cleanup scenarios. */
export class LifecycleRecorder {
  /**
   * Stores event labels in completion order; callers may clear the mutable list between phases.
   * @default []
   */
  public readonly events: string[] = [];

  /**
   * Creates a lifecycle target that records its hook calls and rejects the selected hooks.
   * @param name Label prefixed to every recorded hook event.
   * @param failing Hook names that reject after recording; defaults to an empty list.
   * @returns A target whose hook methods record `name:hook` after a short delay.
   */
  public target(name: string, failing: readonly IRecordedHook[] = []): IRecordedTarget {
    return {
      onModuleInit: () => this.run(name, "onModuleInit", failing),
      onContainerInit: () => this.run(name, "onContainerInit", failing),
      onModuleDestroy: () => this.run(name, "onModuleDestroy", failing),
      beforeContainerShutdown: () => this.run(name, "beforeContainerShutdown", failing),
      onContainerShutdown: () => this.run(name, "onContainerShutdown", failing),
    };
  }

  /**
   * Appends an event that is not associated with a lifecycle hook.
   * @param event Event label to append to {@link events}.
   * @returns No value; appends the event to the recorder.
   */
  public note(event: string): void {
    this.events.push(event);
  }

  /**
   * Waits briefly, records one hook event, and rejects when that hook is configured to fail.
   * @param name Label identifying the target that received the hook.
   * @param hook Hook name being invoked.
   * @param failing Hook names that should reject after being recorded.
   * @returns A promise that resolves after recording or rejects for a configured failure.
   * @throws {Error} The promise rejects when `hook` appears in `failing`.
   */
  private async run(
    name: string,
    hook: IRecordedHook,
    failing: readonly IRecordedHook[],
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, HOOK_DELAY_MS));
    this.events.push(`${name}:${hook}`);
    if (failing.includes(hook)) throw new Error(`${name} ${hook} failed`);
  }
}
