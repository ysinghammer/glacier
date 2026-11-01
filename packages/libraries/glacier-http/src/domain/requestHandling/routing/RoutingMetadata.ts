import { ValueMetadataDefinition, ListMetadataDefinition } from "@glacier/reflection";
import type { IMetadataRead } from "@glacier/reflection";
import type { IApiControllerOptions } from "./types/IApiControllerOptions.js";
import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import type { IApiResponseOptions } from "./types/IApiResponseOptions.js";
import type { IHttpMethod } from "./types/IHttpMethod.js";
import type { IHttpBindingMetadata } from "./types/IHttpBindingMetadata.js";
import type { IHttpErrorMapping } from "../responses/types/IHttpErrorMapping.js";

const FIELD_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/**
 * Owns immutable metadata identities and normalization shared by HTTP route declarations.
 */
export class RoutingMetadata {
  /** Private metadata identity for controller prefix and static options. */
  public static readonly controller = new ValueMetadataDefinition<{
    /** Validated controller route prefix. */
    readonly path: string;
    /** Detached static controller documentation options. */
    readonly options: IApiControllerOptions;
  }>("http controller");
  /** Private metadata identity for one explicitly declared route. */
  public static readonly route = new ValueMetadataDefinition<{
    /** Declared HTTP method. */
    readonly method: IHttpMethod;
    /** Validated route path relative to the controller prefix. */
    readonly path: string;
    /** Detached static route documentation options. */
    readonly options: IApiRouteOptions;
  }>("http route");
  /** Private metadata identity for endpoint success response declarations. */
  public static readonly response = new ValueMetadataDefinition<readonly IApiResponseOptions[]>(
    "http responses",
  );
  /** Private metadata identity for ordered endpoint parameter bindings. */
  public static readonly bindings = new ValueMetadataDefinition<readonly IHttpBindingMetadata[]>(
    "http bindings",
  );
  /** Private metadata identity for the public-route flag. */
  public static readonly publicRoute = new ValueMetadataDefinition<boolean>("http public route");
  /** Private metadata identity for response-log suppression. */
  public static readonly skipLogging = new ValueMetadataDefinition<boolean>(
    "http skip response logging",
  );
  /** Private metadata identity for static endpoint/controller error mappings. */
  public static readonly errorMappings = new ValueMetadataDefinition<readonly IHttpErrorMapping[]>(
    "http error mappings",
  );
  /** Private metadata identity for coherent declared instance method names. */
  public static readonly methods = new ListMetadataDefinition<string>(
    "http declared endpoint names",
  );

  /**
   * Creates a method decorator that records one instance route and rejects duplicate declarations.
   * @param method HTTP method assigned to the route.
   * @param path Validated origin-form route path.
   * @param options Static route documentation options to snapshot.
   * @returns A method decorator that records immutable route metadata.
   */
  public static routeDecorator(
    method: IHttpMethod,
    path: string,
    options: IApiRouteOptions,
  ): MethodDecorator {
    RoutingMetadata.validatePath(path);
    const decorate = RoutingMetadata.route.decorator(
      Object.freeze({ method, path, options: RoutingMetadata.options(options) }),
    );
    /**
     * Attaches route metadata to its instance method after checking for duplicate routes.
     * @param target Prototype receiving the method declaration.
     * @param key Method name being decorated.
     * @param descriptor Method property descriptor.
     * @returns No value; stores this route on the method declaration.
     * @throws {TypeError} When the method already has a route declaration.
     */
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

  /**
   * Validates an instance method target and records its name for endpoint preparation.
   * @param target Prototype receiving the method declaration.
   * @param key String method name to record.
   * @param descriptor Property descriptor of the method.
   * @returns No value; records the method name on its declaring class.
   * @throws {TypeError} When the target is static, the key is not a string, or it is not a method.
   */
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

  /**
   * Adds a declared method name once, including names whose route metadata is incomplete.
   * @param target Prototype declaring the endpoint method.
   * @param key String name of the declared method.
   * @returns No value; updates class metadata only when the name is new.
   */
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

  /**
   * Removes one terminal slash while preserving root and interior separators.
   * @param path Route path to canonicalize.
   * @returns Canonical path with at most one removed terminal slash.
   */
  public static canonical(path: string): string {
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }

  /**
   * Shallow-copies and freezes documentation options and detaches nested JSON examples/headers.
   * @template T Documentation options record type.
   * @param options Caller-owned options record to snapshot.
   * @returns A frozen copy, retaining consumer-owned class identities as references.
   */
  public static options<T extends object>(options: T): T {
    const copy = { ...options };
    if ("tags" in copy && Array.isArray(copy.tags)) copy.tags = Object.freeze([...copy.tags]);
    if ("examples" in copy && typeof copy.examples === "object" && copy.examples !== null)
      copy.examples = RoutingMetadata.jsonCopy(copy.examples);
    if ("headers" in copy && typeof copy.headers === "object" && copy.headers !== null)
      copy.headers = RoutingMetadata.jsonCopy(copy.headers);
    return Object.freeze(copy);
  }

  /**
   * Deep-copies JSON documentation data before recursively freezing the detached copy.
   * @param value Caller-owned documentation object to serialize and copy.
   * @returns A detached recursively frozen JSON object.
   */
  private static jsonCopy(value: object): object {
    const wire = JSON.stringify(value);
    const copy: unknown = JSON.parse(wire);
    return RoutingMetadata.freezeJson(copy);
  }

  /**
   * Recursively freezes a detached documentation object tree.
   * @param value Root object to freeze after validating all descendants.
   * @returns The same object after its descendants and own properties are frozen.
   * @throws {TypeError} When any visited value is not a non-null object.
   */
  private static freezeJson(value: unknown): object {
    if (typeof value !== "object" || value === null)
      throw new TypeError("Invalid documentation record");
    for (const child of Object.values(value)) {
      if (typeof child === "object" && child !== null) RoutingMetadata.freezeJson(child);
    }
    return Object.freeze(value);
  }

  /**
   * Validates a binder declaration and returns a decorator for its parameter position.
   * @param binding Explicit binding source and associated DTO/name/options.
   * @returns A parameter decorator that records the binding at its declared index.
   * @throws {TypeError} When the DTO class, field name, or bound header/cookie name is invalid.
   */
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
    /**
     * Records this binder at a method parameter index and rejects duplicate bindings.
     * @param target Prototype receiving the parameter declaration.
     * @param key String name of the instance method.
     * @param index Zero-based parameter position supplied by decorator execution.
     * @returns No value; stores the binding and records its method name.
     * @throws {TypeError} When target, method key, parameter index, or binding is duplicate.
     */
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

  /**
   * Creates a method decorator that records a true metadata flag once.
   * @param definition Private metadata identity for the flag to record.
   * @returns A method decorator that records the flag on its method declaration.
   */
  public static flagDecorator(definition: ValueMetadataDefinition<boolean>): MethodDecorator {
    /**
     * Applies the flag to its method declaration exactly once.
     * @param target Prototype receiving the method declaration.
     * @param key Method name being decorated.
     * @param descriptor Method property descriptor.
     * @returns No value; records the true flag in metadata.
     * @throws {TypeError} When this method already has the selected flag.
     */
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

  /**
   * Requires a present valid metadata result.
   * @template T Value type stored by the metadata definition.
   * @param result Reflection metadata read result to narrow.
   * @returns The present metadata value.
   * @throws {TypeError} When the result is valid but has no declared value.
   */
  public static require<T>(result: IMetadataRead<T>): T {
    const value = RoutingMetadata.optional(result);
    if (value === undefined) throw new TypeError("Missing HTTP metadata");
    return value;
  }

  /**
   * Converts a valid metadata read into its value or undefined when absent.
   * @template T Value type stored by the metadata definition.
   * @param result Reflection metadata read result to narrow.
   * @returns The present value, or undefined when no declaration exists.
   * @throws {TypeError} When reflection reports an invalid metadata target or declaration.
   */
  public static optional<T>(result: IMetadataRead<T>): T | undefined {
    if (!result.isValid) throw new TypeError("Invalid HTTP metadata");
    return result.isPresent ? result.value : undefined;
  }

  /**
   * Validates origin-form route paths and named parameter segment syntax.
   * @param path Fixed or parameterized route path to validate.
   * @returns No value; accepts paths that satisfy the route grammar.
   * @throws {TypeError} When the path form or any path segment is invalid.
   */
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

/**
 * Binder declaration alternatives before the parameter decorator supplies an index.
 */
type IBindingDeclaration = IHttpBindingMetadata extends infer T
  ? T extends IHttpBindingMetadata
    ? Omit<T, "index">
    : never
  : never;
