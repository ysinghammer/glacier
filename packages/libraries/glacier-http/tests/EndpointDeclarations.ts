import type { IConstructableClass } from "@glacier/reflection";
import { ApiController, ApiResponse } from "../index.js";
import type { IApiResponseOptions } from "../index.js";

/** Test-owned legacy declaration callbacks, consuming only the curated public root. */
export class EndpointDeclarations {
  /**
   * Retrieves a fixture handler descriptor, rejecting malformed declarations before decoration.
   * @param target Test-owned class that declares the method.
   * @param name Own prototype method whose descriptor is required.
   * @returns The method descriptor used by the legacy decorator API.
   * @throws {Error} When the named method has no own descriptor.
   */
  public static descriptor(target: IConstructableClass<object>, name: string): PropertyDescriptor {
    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
    if (descriptor === undefined) throw new Error("Missing test handler");
    return descriptor;
  }

  /**
   * Applies a route decorator and response metadata to one fixture method.
   * @param target Test-owned controller class.
   * @param name Own prototype method receiving the route.
   * @param decorator Method decorator that declares the route.
   * @param response Response contract; defaults to status 204.
   * @returns No value; records both declarations on the fixture method.
   */
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

  /**
   * Adds controller prefix metadata without constructing or starting a server.
   * @param target Test-owned controller class.
   * @param prefix Route prefix; defaults to `/`.
   * @returns No value; records controller metadata on the class.
   */
  public static controller(target: IConstructableClass<object>, prefix = "/"): void {
    ApiController(prefix)(target);
  }
}
