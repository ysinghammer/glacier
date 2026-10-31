import type { IApiResponseOptions } from "./types/IApiResponseOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares one successful response contract enforced before response bytes are committed.
 * @param options Success status, explicit DTO identity where required, and static documentation.
 * @returns A method decorator that records the response declaration.
 * @throws {TypeError} When status, DTO, array mode, or bodyless response fields are invalid.
 */
export function ApiResponse(options: IApiResponseOptions): MethodDecorator {
  const status: number = options.status;
  if (
    !Number.isInteger(options.status) ||
    options.status < 200 ||
    options.status > 299 ||
    status === 205
  )
    throw new TypeError("Invalid response declaration");
  if (options.status !== 204 && typeof options.type !== "function")
    throw new TypeError("Response requires a DTO class");
  if (options.status === 204 && (options.type !== undefined || options.isArray !== undefined))
    throw new TypeError("Bodyless response declaration");
  if (options.isArray !== undefined && typeof options.isArray !== "boolean")
    throw new TypeError("Invalid array declaration");
  const value = RoutingMetadata.options(options);
  /**
   * Appends the response declaration to its endpoint after checking for duplicate status.
   * @param target Prototype receiving the handler declaration.
   * @param key String name of the declared instance handler.
   * @param descriptor Handler method descriptor.
   * @returns No value; records the response metadata for this endpoint.
   * @throws {TypeError} When this endpoint already declares the response status.
   */
  return (target, key, descriptor): void => {
    RoutingMetadata.methodTarget(target, key, descriptor);
    const current =
      RoutingMetadata.optional(
        RoutingMetadata.response.readDynamic(target.constructor, {
          kind: "member",
          member: key,
          inheritance: "own",
        }),
      ) ?? [];
    if (current.some((item) => item.status === options.status))
      throw new TypeError("Duplicate response declaration");
    RoutingMetadata.response.decorator(Object.freeze([...current, value]))(target, key, descriptor);
  };
}
