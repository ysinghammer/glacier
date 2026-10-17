import {
  Inject,
  InjectionMetadata,
  InjectionToken,
  Injectable,
  Optional,
  AggregateContainerError,
  ContainerError,
  type IConstructorDependency,
  type IProviderScope,
  type IToken,
} from "../../index.js";

const token = new InjectionToken<string>("name");
const symbolToken: IToken = token.symbol;
class Service {}
const classToken: IToken = Service;
const phantom: string | undefined = token.phantomType;
const scope: IProviderScope = "request";
const dependencies: readonly IConstructorDependency[] = InjectionMetadata.readDependencies(Service);
const aggregate: readonly Error[] = new AggregateContainerError([new ContainerError("one")]).causes;
const classDecorator: ClassDecorator = Injectable({ scope });
const parameterDecorator: ParameterDecorator = Inject(token);
const optionalDecorator: ParameterDecorator = Optional();
// @ts-expect-error Typed tokens are not interchangeable across value types.
const wrongType: InjectionToken<number> = token;
// @ts-expect-error String tokens are unsupported.
const stringToken: IToken = "name";
// @ts-expect-error Scope is a closed set of literals.
Injectable({ scope: "singleton" });
// @ts-expect-error Inject accepts tokens only.
Inject("name");
void [
  symbolToken,
  classToken,
  phantom,
  dependencies,
  aggregate,
  classDecorator,
  parameterDecorator,
  optionalDecorator,
  wrongType,
  stringToken,
];
