import {
  ContainerContext,
  GlacierContainer,
  InjectionToken,
  Module,
  ModuleRef,
  Providers,
  type ContextId,
  type IValueProvider,
} from "../../index.js";

class Service {
  readonly name = "service";
}
class AppModule {}
Module({ providers: [Service] })(AppModule);
const token = new InjectionToken<string>("name");
const container = await GlacierContainer.create(AppModule);
const contextId: ContextId = ContainerContext.createContextId();

const typedClass: Promise<Service> = container.resolve(Service, contextId);
const typedToken: Promise<string> = container.resolve(token, contextId, { strict: true });
const symbolValue: Promise<unknown> = container.resolve(Symbol("any"));
const fromModuleRef: Promise<Service> = container.select(AppModule).resolve(Service);
const moduleRef: ModuleRef = container.select(AppModule);
const syncValue: string = moduleRef.get(token);
Providers.factory({ provide: token, useFactory: () => "value", scope: "request" });
// @ts-expect-error Scope is a closed set of literals.
Providers.factory({ provide: token, useFactory: () => "value", scope: "forever" });
// @ts-expect-error Context ids come from ContainerContext, not numbers.
container.resolve(Service, 1);
// @ts-expect-error resolve is asynchronous.
const notSync: Service = container.resolve(Service);
const valueWithScope: IValueProvider = {
  provide: token,
  useValue: "x",
  // @ts-expect-error Value providers have no scope.
  scope: "request",
};

export { typedClass, typedToken, symbolValue, fromModuleRef, syncValue, notSync, valueWithScope };
