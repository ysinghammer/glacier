import type {
  IBeforeContainerShutdown,
  IOnContainerInit,
  IOnContainerShutdown,
  IOnModuleDestroy,
  IOnModuleInit,
} from "../../index.js";

/** The lifecycle hook names a recorded target implements. */
export type IRecordedHook =
  | "onModuleInit"
  | "onContainerInit"
  | "onModuleDestroy"
  | "beforeContainerShutdown"
  | "onContainerShutdown";

/** A target implementing every lifecycle hook, handed to the container as a provider value. */
export type IRecordedTarget = IOnModuleInit &
  IOnContainerInit &
  IOnModuleDestroy &
  IBeforeContainerShutdown &
  IOnContainerShutdown;

const HOOK_DELAY_MS = 1;

/** Test-owned double that records hook calls as `name:hook`; every hook finishes only after a short delay. */
export class LifecycleRecorder {
  /** The recorded calls in the order the hooks completed. */
  readonly events: string[] = [];

  /** Creates a target whose hooks record themselves and reject for the hooks listed in `failing`. */
  public target(name: string, failing: readonly IRecordedHook[] = []): IRecordedTarget {
    return {
      onModuleInit: () => this.#run(name, "onModuleInit", failing),
      onContainerInit: () => this.#run(name, "onContainerInit", failing),
      onModuleDestroy: () => this.#run(name, "onModuleDestroy", failing),
      beforeContainerShutdown: () => this.#run(name, "beforeContainerShutdown", failing),
      onContainerShutdown: () => this.#run(name, "onContainerShutdown", failing),
    };
  }

  /** Records a plain event not tied to a hook, such as a factory finishing. */
  public note(event: string): void {
    this.events.push(event);
  }

  async #run(name: string, hook: IRecordedHook, failing: readonly IRecordedHook[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, HOOK_DELAY_MS));
    this.events.push(`${name}:${hook}`);
    if (failing.includes(hook)) throw new Error(`${name} ${hook} failed`);
  }
}
