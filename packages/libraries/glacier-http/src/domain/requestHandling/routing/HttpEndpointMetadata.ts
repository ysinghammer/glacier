import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";
import type { IConstructableClass } from "@glacier/reflection";
import { Schema } from "@glacier/schema";
import { RoutingMetadata } from "./RoutingMetadata.js";
import type { IHttpEndpointMetadata } from "./IHttpEndpointMetadata.js";
import type { IHttpBindingMetadata } from "./IHttpBindingMetadata.js";

/** Prepares the shared endpoint invariants without instances, listeners or OpenAPI dependencies. */
export class HttpEndpointMetadata {
  /** Reads detached metadata. Inherited handlers retain their own contracts; overrides must redeclare all contracts. */
  public static read(controller: IConstructableClass<object>): readonly IHttpEndpointMetadata[] {
    const prefix = RoutingMetadata.require(RoutingMetadata.controller.readDynamic(controller));
    const keys = new Set(
      RoutingMetadata.optional(RoutingMetadata.methods.readDynamic(controller)) ?? [],
    );
    const endpoints: IHttpEndpointMetadata[] = [];
    for (const key of [...keys].sort()) {
      const { owner, descriptor } = HttpEndpointMetadata.#owner(controller, key);
      const address = { kind: "member", member: key, inheritance: "own" } as const;
      const declaration = RoutingMetadata.optional(
        RoutingMetadata.route.readDynamic(owner, address),
      );
      if (declaration === undefined)
        throw new TypeError("Missing own route metadata; ambiguous inherited override");
      const responses = RoutingMetadata.require(
        RoutingMetadata.response.readDynamic(owner, address),
      );
      const bindings =
        RoutingMetadata.optional(RoutingMetadata.bindings.readDynamic(owner, address)) ?? [];
      if (typeof descriptor.value !== "function")
        throw new TypeError("HTTP requires an instance method");
      const parameterTypes = RoutingMetadata.optional(
        DESIGN_PARAMETER_TYPES_METADATA.readDynamic(owner, address),
      );
      const parameterCount =
        parameterTypes === undefined ? descriptor.value.length : parameterTypes.length;
      HttpEndpointMetadata.#bindings(bindings, parameterCount, parameterTypes);
      const template = RoutingMetadata.canonical(
        `${prefix.path === "/" ? "" : RoutingMetadata.canonical(prefix.path)}${declaration.path}`,
      );
      const names = template.split("/").filter((part) => part.startsWith(":"));
      if (new Set(names).size !== names.length) throw new TypeError("Duplicate route parameter");
      for (const binding of bindings) {
        if (binding.location === "param" && !names.includes(`:${binding.name}`))
          throw new TypeError("Unknown bound path parameter");
        if ("dto" in binding) Schema.prepare(binding.dto);
      }
      for (const response of responses) {
        if (response.status !== 204) Schema.prepare(response.type);
      }
      const isPublic =
        RoutingMetadata.optional(RoutingMetadata.publicRoute.readDynamic(owner, address)) === true;
      if (isPublic && bindings.some((binding) => binding.location === "userId"))
        throw new TypeError("UserId requires a protected route");
      endpoints.push(
        Object.freeze({
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
            RoutingMetadata.optional(RoutingMetadata.skipLogging.readDynamic(owner, address)) ===
            true,
          bindings: Object.freeze([...bindings].sort((left, right) => left.index - right.index)),
          responses: Object.freeze(
            [...responses].sort((left, right) => left.status - right.status),
          ),
        }),
      );
    }
    return Object.freeze(endpoints);
  }

  /** Locates the actual handler declaration, not metadata inherited across an override. */
  static #owner(
    controller: IConstructableClass<object>,
    key: string,
  ): { readonly owner: IConstructableClass<object>; readonly descriptor: PropertyDescriptor } {
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

  /** Checks positional completeness and only compiler-representable direct binder types, never DTO inference. */
  static #bindings(
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
