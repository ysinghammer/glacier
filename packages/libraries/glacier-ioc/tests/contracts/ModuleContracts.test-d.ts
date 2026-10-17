import {
  GlacierContainer,
  InjectionToken,
  Module,
  type IDynamicModule,
  type IGetOptions,
  type IModuleExport,
  type IModuleOptions,
  type IModuleReference,
  type ModuleLookup,
} from "../../index.js";

class Service {}
class Feature {}
const token = new InjectionToken<string>("name");

const options: IModuleOptions = { providers: [Service], exports: [Service, Feature], global: true };
const decorator: ClassDecorator = Module(options);
const dynamic: IDynamicModule = { module: Feature, providers: [Service], global: false };
const reference: IModuleReference = dynamic;
const exported: IModuleExport = token;
const getOptions: IGetOptions = { strict: true };
const container = await GlacierContainer.create(Feature);
const lookup: ModuleLookup = container.select(dynamic);
const service: Service = lookup.get(Service, getOptions);
const text: string = container.get(token, { strict: false });
// @ts-expect-error A dynamic module must name its module class.
const missingModule: IDynamicModule = { providers: [] };
// @ts-expect-error Strictness is a boolean.
container.get(Service, { strict: "yes" });

void [decorator, reference, exported, service, text, missingModule];
