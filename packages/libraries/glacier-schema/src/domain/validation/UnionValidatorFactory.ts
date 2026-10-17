import type { IValueFailure } from "./IValueFailure.js";
import type { IOneOfOption } from "./IOneOfOption.js";
import type { IParseContext } from "./IParseContext.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { ReceivedType } from "./ReceivedType.js";
import { TypeFailure } from "./TypeFailure.js";
import type { IValueValidator } from "./ValueValidatorFactory.js";

/** Builds the validators of discriminated and non-discriminated unions. */
export class UnionValidatorFactory {
  /**
   * Returns a validator that reads the `discriminator` property of an object, picks the variant validator
   * registered for its value and returns that variant's outcome, so issues point into the variant. A
   * non-object is `invalid_type`; a missing, non-string or unregistered discriminator is
   * `invalid_discriminator`, located at the discriminator property.
   */
  public static discriminated(
    discriminator: string,
    variants: ReadonlyMap<string, IValueValidator>,
  ): IValueValidator {
    const expected = [...variants.keys()];
    return (value, context) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { isValid: false, failures: [TypeFailure.invalidType("object", value)] };
      }
      const received = Object.hasOwn(value, discriminator)
        ? Reflect.get(value, discriminator)
        : undefined;
      const variant = typeof received === "string" ? variants.get(received) : undefined;
      if (variant === undefined) {
        return {
          isValid: false,
          failures: [
            UnionValidatorFactory.#discriminatorFailure(discriminator, expected, received),
          ],
        };
      }
      return variant(value, context);
    };
  }

  /**
   * Returns a validator accepting a value that matches any option; the first matching option in declaration
   * order wins. Options are tried without coercion first, and only when none matches and the call enables
   * `coerce` once more with each option's own coercion, so an exact match is never converted. When nothing
   * matches the single `invalid_union` failure lists the issues of every option in `params.attempts`.
   */
  public static oneOf(options: readonly IOneOfOption[]): IValueValidator {
    return (value, context) => {
      const exact = UnionValidatorFactory.#attempt(options, value, context, false);
      if (
        exact.isValid ||
        context.options.coerce !== true ||
        value === undefined ||
        value === null
      ) {
        return exact.isValid ? exact : UnionValidatorFactory.#noMatch(exact.attempts);
      }
      const coerced = UnionValidatorFactory.#attempt(options, value, context, true);
      return coerced.isValid ? coerced : UnionValidatorFactory.#noMatch(coerced.attempts);
    };
  }

  /** Tries every option in order and stops at the first accepted one. */
  static #attempt(
    options: readonly IOneOfOption[],
    value: unknown,
    context: IParseContext,
    isCoerced: boolean,
  ): IValueOutcome & { readonly attempts: readonly (readonly IValueFailure[])[] } {
    const attempts: (readonly IValueFailure[])[] = [];
    for (const option of options) {
      const outcome = option.validate(isCoerced ? option.coerce(value) : value, context);
      if (outcome.isValid) return { ...outcome, attempts };
      attempts.push(outcome.failures);
    }
    return { isValid: false, failures: [], attempts };
  }

  /** Builds the `invalid_union` rejection carrying the issues of each attempted option. */
  static #noMatch(attempts: readonly (readonly IValueFailure[])[]): IValueOutcome {
    return {
      isValid: false,
      failures: [
        {
          code: "invalid_union",
          message: "Value does not match any of the allowed types",
          params: {
            attempts: attempts.map((failures) =>
              failures.map((failure) => ({
                path: failure.path ?? [],
                code: failure.code,
                message: failure.message,
                params: failure.params,
              })),
            ),
          },
        },
      ],
    };
  }

  /** Builds the rejection of a missing or unknown discriminator value. */
  static #discriminatorFailure(
    discriminator: string,
    expected: readonly string[],
    received: unknown,
  ): IValueFailure {
    const allowed = expected.map((name) => JSON.stringify(name)).join(", ");
    const message =
      received === undefined
        ? `Missing discriminator "${discriminator}", expected one of: ${allowed}`
        : `Invalid discriminator ${typeof received === "string" ? JSON.stringify(received) : ReceivedType.describe(received)} for "${discriminator}", expected one of: ${allowed}`;
    return {
      code: "invalid_discriminator",
      message,
      params: { discriminator, expected, received },
      path: [discriminator],
    };
  }
}
