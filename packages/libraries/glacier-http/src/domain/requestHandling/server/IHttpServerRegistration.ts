import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

/** Detached documentation bridge with class identities, never instances, hooks or native resources. */
export interface IHttpServerRegistration {
  readonly controllers: readonly IConstructableClass<object>[];
  readonly errorMappings: readonly IHttpErrorMapping[];
  readonly hasAuthentication: boolean;
}
