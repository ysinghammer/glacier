import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";
import type { IConstructableClass } from "@glacier/reflection";
import { Schema } from "@glacier/schema";
import { RoutingMetadata } from "./RoutingMetadata.js";
import type { IHttpEndpointMetadata } from "./types/IHttpEndpointMetadata.js";
import type { IHttpBindingMetadata } from "./types/IHttpBindingMetadata.js";
import type { IApiResponseOptions } from "./types/IApiResponseOptions.js";
import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";

/**
 * Prepares immutable endpoint contracts and validates shared route/binder invariants.
 */
export class HttpEndpointMetadata {
  /**
   * Reads and sorts endpoint metadata without constructing controllers or starting resources.
   * @param controller Registered controller class identity whose endpoints are prepared.
   * @returns Frozen endpoint contracts ordered by declared handler name.
   */
  public static read(controller: IConstructableClass<object>): readonly IHttpEndpointMetadata[] {
    const prefix = RoutingMetadata.require(RoutingMetadata.controller.readDynamic(controller));
    const keys = new Set(
      RoutingMetadata.optional(RoutingMetadata.methods.readDynamic(controller)) ?? [],
    );
    const endpoints: IHttpEndpointMetadata[] = [];
    for (const key of [...keys].sort())
      endpoints.push(HttpEndpointMetadata.endpoint(controller, key, prefix));
    return Object.freeze(endpoints);
  }

  /**
   * Validates and assembles one controller method's complete endpoint contract.
   * @param controller Registered controller class identity.
   * @param key Declared instance method name.
   * @param prefix Controller path prefix and static documentation options.
   * @returns Frozen metadata for the resolved endpoint.
   * @throws {TypeError} When route metadata, method shape, path names, or visibility conflict.
   */
  private static endpoint(
    controller: IConstructableClass<object>,
    key: string,
    prefix: {
      readonly path: string;
      readonly options: IHttpEndpointMetadata["controllerOptions"];
    },
  ): IHttpEndpointMetadata {
    const { owner, descriptor } = HttpEndpointMetadata.owner(controller, key);
    const address = { kind: "member", member: key, inheritance: "own" } as const;
    const declaration = RoutingMetadata.optional(RoutingMetadata.route.readDynamic(owner, address));
    if (declaration === undefined)
      throw new TypeError("Missing own route metadata; ambiguous inherited override");
    const responses = RoutingMetadata.require(RoutingMetadata.response.readDynamic(owner, address));
    const bindings =
      RoutingMetadata.optional(RoutingMetadata.bindings.readDynamic(owner, address)) ?? [];
    if (typeof descriptor.value !== "function")
      throw new TypeError("HTTP requires an instance method");
    const parameterTypes = RoutingMetadata.optional(
      DESIGN_PARAMETER_TYPES_METADATA.readDynamic(owner, address),
    );
    const parameterCount =
      parameterTypes === undefined ? descriptor.value.length : parameterTypes.length;
    HttpEndpointMetadata.validateEndpointBindings(
      bindings,
      parameterCount,
      parameterTypes,
      responses,
    );
    const template = RoutingMetadata.canonical(
      `${prefix.path === "/" ? "" : RoutingMetadata.canonical(prefix.path)}${declaration.path}`,
    );
    const names = template.split("/").filter((part) => part.startsWith(":"));
    if (new Set(names).size !== names.length) throw new TypeError("Duplicate route parameter");
    HttpEndpointMetadata.validatePathBindings(bindings, names);
    const isPublic =
      RoutingMetadata.optional(RoutingMetadata.publicRoute.readDynamic(owner, address)) === true;
    if (isPublic && bindings.some((binding) => binding.location === "userId"))
      throw new TypeError("UserId requires a protected route");
    return HttpEndpointMetadata.metadata(
      controller,
      owner,
      key,
      address,
      prefix,
      declaration,
      bindings,
      responses,
      template,
      isPublic,
    );
  }

  /**
   * Checks binder positions and prepares explicitly declared input/output DTO schemas.
   * @param bindings Ordered explicit parameter binders.
   * @param parameterCount Handler parameter count from compiler metadata or function length.
   * @param parameterTypes Compiler-representable direct parameter types when available.
   * @param responses Declared response contracts whose DTO schemas are prepared.
   * @returns No value; validates schema and binder compatibility before serving.
   */
  private static validateEndpointBindings(
    bindings: readonly IHttpBindingMetadata[],
    parameterCount: number,
    parameterTypes: readonly unknown[] | undefined,
    responses: readonly IApiResponseOptions[],
  ): void {
    HttpEndpointMetadata.bindings(bindings, parameterCount, parameterTypes);
    for (const binding of bindings) if ("dto" in binding) Schema.prepare(binding.dto);
    for (const response of responses) if (response.status !== 204) Schema.prepare(response.type);
  }

  /**
   * Confirms every named path binder appears in the combined route template.
   * @param bindings Explicit endpoint parameter bindings.
   * @param names Named route segments available for binding.
   * @returns No value; validates path binder references.
   * @throws {TypeError} When a path binder references an undeclared route segment.
   */
  private static validatePathBindings(
    bindings: readonly IHttpBindingMetadata[],
    names: readonly string[],
  ): void {
    for (const binding of bindings) {
      if (binding.location === "param" && !names.includes(`:${binding.name}`))
        throw new TypeError("Unknown bound path parameter");
    }
  }

  /**
   * Creates the detached immutable endpoint record from validated declarations.
   * @param controller Registered controller identity exposed in the endpoint record.
   * @param owner Class that declares the concrete handler implementation.
   * @param key Handler method name.
   * @param address Own-member metadata address for the declaring class.
   * @param prefix Controller route prefix and documentation options.
   * @param declaration Route method, path, and documentation options.
   * @param bindings Explicit parameter binders to sort and retain.
   * @param responses Explicit success response declarations to sort and retain.
   * @param template Canonical combined route template.
   * @param isPublic Whether external authentication is skipped for this route.
   * @returns Frozen detached metadata with sorted binders and response contracts.
   */
  private static metadata(
    controller: IConstructableClass<object>,
    owner: IConstructableClass<object>,
    key: string,
    address: { readonly kind: "member"; readonly member: string; readonly inheritance: "own" },
    prefix: {
      readonly path: string;
      readonly options: IHttpEndpointMetadata["controllerOptions"];
    },
    declaration: {
      readonly method: IHttpEndpointMetadata["method"];
      readonly path: string;
      readonly options: IApiRouteOptions;
    },
    bindings: readonly IHttpBindingMetadata[],
    responses: readonly IApiResponseOptions[],
    template: string,
    isPublic: boolean,
  ): IHttpEndpointMetadata {
    return Object.freeze({
      controller,
      controllerName: controller.name,
      handlerName: key,
      method: declaration.method,
      template,
      controllerOptions: prefix.options,
      routeOptions: declaration.options,
      controllerErrorMappings:
        RoutingMetadata.optional(RoutingMetadata.errorMappings.readDynamic(controller)) ??
        Object.freeze([]),
      endpointErrorMappings:
        RoutingMetadata.optional(RoutingMetadata.errorMappings.readDynamic(owner, address)) ??
        Object.freeze([]),
      isPublic,
      isResponseLoggingSkipped:
        RoutingMetadata.optional(RoutingMetadata.skipLogging.readDynamic(owner, address)) === true,
      bindings: Object.freeze([...bindings].sort((left, right) => left.index - right.index)),
      responses: Object.freeze([...responses].sort((left, right) => left.status - right.status)),
    });
  }

  /**
   * Finds the class that owns a handler implementation, not inherited metadata on an override.
   * @param controller Registered class whose prototype chain is searched.
   * @param key Declared handler name to locate.
   * @returns Owning class identity and its own method descriptor.
   * @throws {TypeError} When no class in the chain declares the handler.
   */
  private static owner(
    controller: IConstructableClass<object>,
    key: string,
  ): {
    /** Class identity that owns the concrete handler declaration. */
    readonly owner: IConstructableClass<object>;
    /** Own property descriptor for the declared handler. */
    readonly descriptor: PropertyDescriptor;
  } {
    let owner = controller;
    while (true) {
      const descriptor = Object.getOwnPropertyDescriptor(owner.prototype, key);
      if (descriptor !== undefined) return { owner, descriptor };
      const parent: unknown = Object.getPrototypeOf(owner);
      if (typeof parent !== "function" || !("prototype" in parent))
        throw new TypeError("Missing handler");
      // Reflection validates class identity; JavaScript's prototype walk erases the constructor signature.
      owner = parent as IConstructableClass<object>;
    }
  }

  /**
   * Checks positional completeness and direct compiler-representable binder types.
   * @param bindings Declared binders with zero-based parameter positions.
   * @param count Handler parameter count.
   * @param types Optional compiler-emitted parameter type representations.
   * @returns No value; validates binder completeness and supported direct types.
   * @throws {TypeError} When a binder is missing or a user ID parameter is not string-typed.
   */
  private static bindings(
    bindings: readonly IHttpBindingMetadata[],
    count: number,
    types: readonly unknown[] | undefined,
  ): void {
    if (bindings.length !== count || bindings.some((binding) => binding.index >= count))
      throw new TypeError("Missing parameter binder");
    for (const binding of bindings) {
      if (types !== undefined && binding.location === "userId" && types[binding.index] !== String)
        throw new TypeError("UserId requires a string parameter");
    }
  }
}
