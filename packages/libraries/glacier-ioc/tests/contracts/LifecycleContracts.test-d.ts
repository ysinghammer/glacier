import {
  GlacierContainer,
  InjectionToken,
  Module,
  Providers,
  type IBeforeContainerShutdown,
  type IOnContainerInit,
  type IOnContainerShutdown,
  type IOnModuleDestroy,
  type IOnModuleInit,
} from "../../index.js";

/** Implements all public lifecycle contracts to verify their accepted method shapes. */
class Database
  implements
    IOnModuleInit,
    IOnContainerInit,
    IOnModuleDestroy,
    IBeforeContainerShutdown,
    IOnContainerShutdown
{
  /**
   * Satisfies module initialization with an asynchronous implementation.
   * @returns A promise that resolves when module initialization completes.
   */
  public async onModuleInit(): Promise<void> {}
  /**
   * Satisfies container initialization with a synchronous implementation.
   * @returns No value; marks container initialization as supported.
   */
  public onContainerInit(): void {}
  /**
   * Satisfies module destruction with a synchronous implementation.
   * @returns No value; marks module destruction as supported.
   */
  public onModuleDestroy(): void {}
  /**
   * Satisfies pre-shutdown with an asynchronous implementation.
   * @returns A promise that resolves when pre-shutdown work completes.
   */
  public async beforeContainerShutdown(): Promise<void> {}
  /**
   * Satisfies container shutdown with a synchronous implementation.
   * @returns No value; marks container shutdown as supported.
   */
  public onContainerShutdown(): void {}
}
/** Root module that registers the lifecycle contract fixture. */
class AppModule {}
Module({ providers: [Database] })(AppModule);
const token = new InjectionToken<number>("count");

const created: Promise<GlacierContainer> = GlacierContainer.create(AppModule);
const closed: Promise<void> = (await created).close();
const asyncFactory = Providers.factory({ provide: token, useFactory: async () => 1 });
const syncFactory = Providers.factory({ provide: token, useFactory: () => 1 });
// @ts-expect-error A factory must produce a value, not a promise of the wrong type via inject mismatch.
Providers.factory({ provide: token, inject: [token] as const, useFactory: (text: string) => text });
// @ts-expect-error create is async; its result is not a container.
const notAContainer: GlacierContainer = GlacierContainer.create(AppModule);
// @ts-expect-error A hook cannot take arguments.
const badHook: IOnModuleInit = { onModuleInit: (value: string) => value };
void [closed, asyncFactory, syncFactory, notAContainer, badHook];
