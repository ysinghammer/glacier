import {
  GlacierContainer,
  InjectionToken,
  Providers,
  type IFactoryProvider,
  type IProvider,
} from "../../index.js";

class Repository {}
const host = new InjectionToken<string>("host");
const port = new InjectionToken<number>("port");
const result = new InjectionToken<string>("result");

const typed = Providers.factory({
  provide: result,
  inject: [host, port, Repository] as const,
  useFactory: (hostName, portNumber, repository) => {
    const checkedHost: string = hostName;
    const checkedPort: number = portNumber;
    const checkedRepository: Repository = repository;
    return `${checkedHost}${checkedPort}${String(checkedRepository)}`;
  },
});
const asProvider: IProvider = typed;
const container = GlacierContainer.create({
  providers: [Repository, { provide: host, useValue: "h" }, typed],
});
const text: string = container.get(host);
const instance: Repository = container.get(Repository);
const unknownSymbol: unknown = container.get(Symbol("s"));
const annotated: IFactoryProvider<readonly [typeof host], string> = {
  provide: result,
  inject: [host],
  useFactory: (hostName) => hostName,
};

Providers.factory({
  provide: result,
  inject: [host, port] as const,
  // @ts-expect-error Argument types must match the token types of the inject tuple.
  useFactory: (hostName: number, portNumber: string) => `${hostName}${portNumber}`,
});
// @ts-expect-error Typed tokens resolve to their own value type.
const wrong: number = container.get(host);
// @ts-expect-error String tokens are unsupported in providers.
const stringProvider: IProvider = { provide: "name", useValue: 1 };
void [asProvider, text, instance, unknownSymbol, annotated, wrong, stringProvider];
