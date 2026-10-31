import type { IHttpErrorMapping } from "./types/IHttpErrorMapping.js";
import { HttpContractError } from "./HttpContract.error.js";
import { SchemaError, SchemaDefinitionError } from "@glacier/schema";

// Static Unicode text is allowed, but control characters cannot reach public problems.
const PUBLIC_TEXT = /^[^\p{Cc}]*$/u;

/** Prepares static mapping scopes and resolves nearest prototypes without inspecting exception properties. */
export class ErrorMappings {
  /** Validates and detaches one scope; duplicate class identities cannot silently replace mappings. */
  public static prepare(mappings: readonly IHttpErrorMapping[]): readonly IHttpErrorMapping[] {
    if (!Array.isArray(mappings)) throw new TypeError("Invalid error mappings");
    const result: IHttpErrorMapping[] = [];
    for (const mapping of mappings) {
      ErrorMappings.validateMapping(mapping);
      if (result.some((item) => item.error === mapping.error))
        throw new TypeError("Duplicate error mapping");
      result.push(
        Object.freeze({
          error: mapping.error,
          status: mapping.status,
          title: mapping.title,
          ...(mapping.detail === undefined ? {} : { detail: mapping.detail }),
          ...(mapping.type === undefined ? {} : { type: mapping.type }),
        }),
      );
    }
    return Object.freeze(result);
  }

  private static validateMapping(mapping: IHttpErrorMapping): void {
    ErrorMappings.validateError(mapping.error);
    ErrorMappings.validateStatus(mapping.status);
    ErrorMappings.validateText(mapping.title, "Invalid error mapping");
    if (mapping.detail !== undefined)
      ErrorMappings.validateText(mapping.detail, "Invalid error mapping", false);
    if (mapping.type !== undefined) ErrorMappings.validateType(mapping.type);
  }

  private static validateError(error: IHttpErrorMapping["error"]): void {
    if (typeof error !== "function" || (error !== Error && !(error.prototype instanceof Error)))
      throw new TypeError("Invalid error mapping");
  }

  private static validateStatus(status: number): void {
    if (!Number.isInteger(status) || status < 400 || status > 599)
      throw new TypeError("Invalid error mapping");
  }

  private static validateText(value: string, message: string, isRequired = true): void {
    if (typeof value !== "string" || (isRequired && value.length === 0) || !PUBLIC_TEXT.test(value))
      throw new TypeError(message);
  }

  private static validateType(type: string): void {
    if (typeof type !== "string" || !PUBLIC_TEXT.test(type) || /\s/.test(type))
      throw new TypeError("Invalid problem type URI");
    // URL rejects relative references; non-HTTP absolute identifiers such as urn: are valid.
    new URL(type);
  }

  /** Endpoint, controller, then global scope wins; the nearest matching class wins within that scope. */
  public static resolve(
    error: unknown,
    scopes: readonly (readonly IHttpErrorMapping[])[],
  ): IHttpErrorMapping | undefined {
    if (
      !(error instanceof Error) ||
      error instanceof HttpContractError ||
      error instanceof SchemaError ||
      error instanceof SchemaDefinitionError
    )
      return undefined;
    for (const scope of scopes) {
      let prototype: object | null = Object.getPrototypeOf(error);
      while (prototype !== null) {
        const mapping = scope.find((item) => item.error.prototype === prototype);
        if (mapping !== undefined) return mapping;
        prototype = Object.getPrototypeOf(prototype);
      }
    }
    return undefined;
  }
}
