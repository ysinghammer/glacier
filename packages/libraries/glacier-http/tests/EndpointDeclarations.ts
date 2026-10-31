import type { IConstructableClass } from "@glacier/reflection";
import { ApiController, ApiResponse } from "../index.js";
import type { IApiResponseOptions } from "../index.js";

/** Test-owned legacy declaration callbacks, consuming only the curated public root. */
export class EndpointDeclarations {
  /** Gets a test class's own descriptor, failing explicitly for a malformed fixture. */
  public static descriptor(target: IConstructableClass<object>, name: string): PropertyDescriptor {
    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
    if (descriptor === undefined) throw new Error("Missing test handler");
    return descriptor;
  }

  /** Registers a test-owned explicit controller and one response contract per method. */
  public static route(
    target: IConstructableClass<object>,
    name: string,
    decorator: MethodDecorator,
    response: IApiResponseOptions = { status: 204 },
  ): void {
    const descriptor = EndpointDeclarations.descriptor(target, name);
    decorator(target.prototype, name, descriptor);
    ApiResponse(response)(target.prototype, name, descriptor);
  }

  /** Registers a prefix without starting resources. */
  public static controller(target: IConstructableClass<object>, prefix = "/"): void {
    ApiController(prefix)(target);
  }
}
