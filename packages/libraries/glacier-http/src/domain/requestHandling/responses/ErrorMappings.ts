import type { IHttpErrorMapping } from "./types/IHttpErrorMapping.js";
import { HttpContractError } from "./HttpContract.error.js";
import { SchemaError, SchemaDefinitionError } from "@glacier/schema";

// Static Unicode text is allowed, but control characters cannot reach public problems.
const PUBLIC_TEXT = /^[^\p{Cc}]*$/u;

/** Prepares static mapping scopes and resolves nearest prototypes without inspecting exception properties. */
export class ErrorMappings {
  /**
   * Validates and freezes one mapping scope without invoking error constructors.
   * @param mappings Static error class mappings for one precedence scope.
   * @returns A detached frozen scope preserving declaration order.
   * @throws {TypeError} When mappings is not an array or repeats an error class identity.
   */
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

  /**
   * Validates all fields of one static mapping declaration.
   * @param mapping Candidate mapping to validate.
   * @returns No value; validation failures are raised by the specific field validators.
   */
  private static validateMapping(mapping: IHttpErrorMapping): void {
    ErrorMappings.validateError(mapping.error);
    ErrorMappings.validateStatus(mapping.status);
    ErrorMappings.validateText(mapping.title, "Invalid error mapping");
    if (mapping.detail !== undefined)
      ErrorMappings.validateText(mapping.detail, "Invalid error mapping", false);
    if (mapping.type !== undefined) ErrorMappings.validateType(mapping.type);
  }

  /**
   * Confirms that the mapping key is Error or an Error subclass constructor.
   * @param error Candidate error class identity.
   * @returns No value; validates the class before it is retained.
   * @throws {TypeError} When the value is not an Error constructor.
   */
  private static validateError(error: IHttpErrorMapping["error"]): void {
    if (typeof error !== "function" || (error !== Error && !(error.prototype instanceof Error)))
      throw new TypeError("Invalid error mapping");
  }

  /**
   * Confirms the mapping status is an integer client or server error code.
   * @param status Candidate HTTP status.
   * @returns No value; validates the status before it is retained.
   * @throws {TypeError} When status is not an integer from 400 through 599.
   */
  private static validateStatus(status: number): void {
    if (!Number.isInteger(status) || status < 400 || status > 599)
      throw new TypeError("Invalid error mapping");
  }

  /**
   * Validates static public text and optionally allows an empty string.
   * @param value Candidate Unicode text.
   * @param message Safe validation message used if the value is rejected.
   * @param isRequired Whether the text must be nonempty; defaults to true.
   * @returns No value; accepts only control-character-free text.
   * @throws {TypeError} When text is not a string, is required but empty, or has controls.
   */
  private static validateText(value: string, message: string, isRequired = true): void {
    if (typeof value !== "string" || (isRequired && value.length === 0) || !PUBLIC_TEXT.test(value))
      throw new TypeError(message);
  }

  /**
   * Validates a static absolute Problem Details type URI.
   * @param type Candidate URI string.
   * @returns No value; confirms an absolute control-free identifier.
   * @throws {TypeError} When the URI contains controls, whitespace, or is not absolute.
   */
  private static validateType(type: string): void {
    if (typeof type !== "string" || !PUBLIC_TEXT.test(type) || /\s/.test(type))
      throw new TypeError("Invalid problem type URI");
    // URL rejects relative references; non-HTTP absolute identifiers such as urn: are valid.
    new URL(type);
  }

  /**
   * Resolves the nearest mapped Error prototype in endpoint, controller, then global scopes.
   * @param error Unknown value raised by endpoint processing.
   * @param scopes Prepared mapping scopes ordered from most to least specific.
   * @returns The first matching static mapping, or undefined when no mapping applies.
   */
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
