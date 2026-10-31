import { ValueMetadataDefinition, ListMetadataDefinition } from "@glacier/reflection";
import type { IMetadataRead } from "@glacier/reflection";
import type { IApiControllerOptions } from "./types/IApiControllerOptions.js";
import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import type { IApiResponseOptions } from "./types/IApiResponseOptions.js";
import type { IHttpMethod } from "./types/IHttpMethod.js";
import type { IHttpBindingMetadata } from "./types/IHttpBindingMetadata.js";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

const FIELD_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/** Cohesive private endpoint definitions; consumers cannot reset or inspect these identities. */
export class RoutingMetadata {
  static readonly controller = new ValueMetadataDefinition<{
    readonly path: string;
    readonly options: IApiControllerOptions;
  }>("http controller");
  static readonly route = new ValueMetadataDefinition<{
    readonly method: IHttpMethod;
    readonly path: string;
    readonly options: IApiRouteOptions;
  }>("http route");
  static readonly response = new ValueMetadataDefinition<readonly IApiResponseOptions[]>(
    "http responses",
  );
  static readonly bindings = new ValueMetadataDefinition<readonly IHttpBindingMetadata[]>(
    "http bindings",
  );
  static readonly publicRoute = new ValueMetadataDefinition<boolean>("http public route");
  static readonly skipLogging = new ValueMetadataDefinition<boolean>("http skip response logging");
  static readonly errorMappings = new ValueMetadataDefinition<readonly IHttpErrorMapping[]>(
    "http error mappings",
  );
  static readonly methods = new ListMetadataDefinition<string>("http declared endpoint names");

  /** Creates an instance-method route decorator, rejecting duplicates irrespective of verb. */
  public static routeDecorator(
    method: IHttpMethod,
    path: string,
    options: IApiRouteOptions,
  ): MethodDecorator {
    RoutingMetadata.validatePath(path);
    const decorate = RoutingMetadata.route.decorator(
      Object.freeze({ method, path, options: RoutingMetadata.options(options) }),
    );
    return (target, key, descriptor): void => {
      RoutingMetadata.methodTarget(target, key, descriptor);
      if (
        RoutingMetadata.optional(
          RoutingMetadata.route.readDynamic(target.constructor, {
            kind: "member",
            member: key,
            inheritance: "own",
          }),
        ) !== undefined
      )
        throw new TypeError(`Duplicate ${method} declaration`);
      decorate(target, key, descriptor);
    };
  }

  /** Rejects static/accessor/symbol declarations rather than guessing handler identity. */
  public static methodTarget(
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor,
  ): void {
    if (
      typeof target === "function" ||
      typeof key !== "string" ||
      typeof descriptor.value !== "function"
    )
      throw new TypeError("HTTP requires an instance method");
    RoutingMetadata.recordMethod(target, key);
  }

  /** Records coherent endpoint names through reflection, including orphan declarations to reject on preparation. */
  private static recordMethod(target: object, key: string): void {
    const current =
      RoutingMetadata.optional(
        RoutingMetadata.methods.readDynamic(target.constructor, {
          kind: "class",
          inheritance: "own",
        }),
      ) ?? [];
    if (!current.includes(key))
      RoutingMetadata.methods.decorator([...current, key])(target.constructor);
  }

  /** Canonicalizes one terminal slash while preserving root and repeated interior separators. */
  public static canonical(path: string): string {
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }

  /** Snapshots documentation records and tags without freezing consumer-owned class references. */
  public static options<T extends object>(options: T): T {
    const copy = { ...options };
    if ("tags" in copy && Array.isArray(copy.tags)) copy.tags = Object.freeze([...copy.tags]);
    if ("examples" in copy && typeof copy.examples === "object" && copy.examples !== null)
      copy.examples = RoutingMetadata.jsonCopy(copy.examples);
    if ("headers" in copy && typeof copy.headers === "object" && copy.headers !== null)
      copy.headers = RoutingMetadata.jsonCopy(copy.headers);
    return Object.freeze(copy);
  }

  /** Copies JSON-only documentation; unsafe cyclic/non-JSON options are definition failures. */
  private static jsonCopy(value: object): object {
    const wire = JSON.stringify(value);
    const copy: unknown = JSON.parse(wire);
    return RoutingMetadata.freezeJson(copy);
  }

  /** Recursively freezes the detached documentation tree. */
  private static freezeJson(value: unknown): object {
    if (typeof value !== "object" || value === null)
      throw new TypeError("Invalid documentation record");
    for (const child of Object.values(value)) {
      if (typeof child === "object" && child !== null) RoutingMetadata.freezeJson(child);
    }
    return Object.freeze(value);
  }

  /** Records one explicit parameter binding; duplicate positions/locations are invalid. */
  public static bindingDecorator(binding: IBindingDeclaration): ParameterDecorator {
    if ("dto" in binding && typeof binding.dto !== "function")
      throw new TypeError("Binder requires a DTO class");
    if ("name" in binding && (typeof binding.name !== "string" || binding.name.length === 0))
      throw new TypeError("Binder requires a name");
    if (
      (binding.location === "header" || binding.location === "cookie") &&
      !FIELD_NAME.test(binding.name)
    )
      throw new TypeError("Invalid bound field name");
    return (target, key, index): void => {
      if (
        typeof target === "function" ||
        typeof key !== "string" ||
        !Number.isSafeInteger(index) ||
        index < 0
      )
        throw new TypeError("Binder requires an instance method parameter");
      const current =
        RoutingMetadata.optional(
          RoutingMetadata.bindings.readDynamic(target.constructor, {
            kind: "member",
            member: key,
            inheritance: "own",
          }),
        ) ?? [];
      if (
        current.some(
          (item) =>
            item.index === index ||
            (item.location === binding.location &&
              (!("name" in item) || ("name" in binding && item.name === binding.name))),
        )
      )
        throw new TypeError("Duplicate parameter binding");
      const value = Object.freeze({ ...binding, index });
      RoutingMetadata.bindings.decorator(Object.freeze([...current, value]))(target, key);
      RoutingMetadata.recordMethod(target, key);
    };
  }

  /** Records a method opt-out once; no request-time registry mutation occurs. */
  public static flagDecorator(definition: ValueMetadataDefinition<boolean>): MethodDecorator {
    return (target, key, descriptor): void => {
      RoutingMetadata.methodTarget(target, key, descriptor);
      if (
        RoutingMetadata.optional(
          definition.readDynamic(target.constructor, {
            kind: "member",
            member: key,
            inheritance: "own",
          }),
        ) !== undefined
      )
        throw new TypeError("Duplicate HTTP flag");
      definition.decorator(true)(target, key, descriptor);
    };
  }

  /** Rejects incomplete/invalid metadata through the same public reflection outcome contract. */
  public static require<T>(result: IMetadataRead<T>): T {
    const value = RoutingMetadata.optional(result);
    if (value === undefined) throw new TypeError("Missing HTTP metadata");
    return value;
  }

  /** Narrows public metadata outcomes, distinguishing absent declarations from invalid targets. */
  public static optional<T>(result: IMetadataRead<T>): T | undefined {
    if (!result.isValid) throw new TypeError("Invalid HTTP metadata");
    return result.isPresent ? result.value : undefined;
  }

  /** Fixed/parameter route paths must be origin-form and free from query/fragments or dot segments. */
  public static validatePath(path: string): void {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      /[?#%\\]/.test(path) ||
      [...path].some(
        (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
      )
    )
      throw new TypeError("Invalid route path");
    if (
      path
        .split("/")
        .some(
          (part) =>
            part === "." ||
            part === ".." ||
            (part.includes(":") && !/^:[A-Za-z][A-Za-z0-9_]*$/.test(part)),
        )
    )
      throw new TypeError("Invalid route segment");
  }
}

/** Preserves each explicit binder alternative while the legacy callback supplies its index. */
type IBindingDeclaration = IHttpBindingMetadata extends infer T
  ? T extends IHttpBindingMetadata
    ? Omit<T, "index">
    : never
  : never;
