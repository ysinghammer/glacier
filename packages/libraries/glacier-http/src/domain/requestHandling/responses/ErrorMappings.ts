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
      if (
        typeof mapping.error !== "function" ||
        (mapping.error !== Error && !(mapping.error.prototype instanceof Error)) ||
        !Number.isInteger(mapping.status) ||
        mapping.status < 400 ||
        mapping.status > 599 ||
        typeof mapping.title !== "string" ||
        mapping.title.length === 0 ||
        !PUBLIC_TEXT.test(mapping.title) ||
        (mapping.detail !== undefined &&
          (typeof mapping.detail !== "string" || !PUBLIC_TEXT.test(mapping.detail)))
      )
        throw new TypeError("Invalid error mapping");
      if (mapping.type !== undefined) {
        if (
          typeof mapping.type !== "string" ||
          !PUBLIC_TEXT.test(mapping.type) ||
          /\s/.test(mapping.type)
        )
          throw new TypeError("Invalid problem type URI");
        // URL rejects relative references; non-HTTP absolute identifiers such as urn: are valid.
        new URL(mapping.type);
      }
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
