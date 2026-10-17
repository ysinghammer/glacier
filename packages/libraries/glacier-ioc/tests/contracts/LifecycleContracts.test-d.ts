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

class Database
  implements
    IOnModuleInit,
    IOnContainerInit,
    IOnModuleDestroy,
    IBeforeContainerShutdown,
    IOnContainerShutdown
{
  public async onModuleInit(): Promise<void> {}
  public onContainerInit(): void {}
  public onModuleDestroy(): void {}
  public async beforeContainerShutdown(): Promise<void> {}
  public onContainerShutdown(): void {}
}
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
