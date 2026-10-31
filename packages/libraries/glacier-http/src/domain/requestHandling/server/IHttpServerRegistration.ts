import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

/** Detached documentation bridge with class identities, never instances, hooks or native resources. */
export interface IHttpServerRegistration {
  /** Controller class identities captured for later explicit instance composition. */
  readonly controllers: readonly IConstructableClass<object>[];
  /** Static error mappings captured with the controller registrations. */
  readonly errorMappings: readonly IHttpErrorMapping[];
  /** Whether external authentication was declared for this registration. */
  readonly hasAuthentication: boolean;
}
