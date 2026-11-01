import type { IValueFailure } from "../types/IValueFailure.js";
import type { IOneOfOption } from "../types/IOneOfOption.js";
import type { IParseContext } from "../types/IParseContext.js";
import type { IValueOutcome } from "../types/IValueOutcome.js";
import { ReceivedType } from "../ReceivedType.js";
import { TypeFailure } from "../TypeFailure.js";
import type { IValueValidator } from "./ValueValidator.factory.js";

/** Builds the validators of discriminated and non-discriminated unions. */
export class UnionValidatorFactory {
  /**
   * Creates a validator that dispatches an object to the validator selected by its discriminator.
   * @param discriminator Own property whose string value selects the variant.
   * @param variants Map from allowed discriminator strings to value validators.
   * @returns Validator that preserves the selected variant's outcome and issue paths.
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
          failures: [UnionValidatorFactory.discriminatorFailure(discriminator, expected, received)],
        };
      }
      return variant(value, context);
    };
  }

  /**
   * Creates a validator accepting the first matching non-discriminated union option.
   * @param options Ordered validators and per-option coercers used only after exact checks fail.
   * @returns Validator with one `invalid_union` failure containing attempts when none match.
   */
  public static oneOf(options: readonly IOneOfOption[]): IValueValidator {
    return (value, context) => {
      const exact = UnionValidatorFactory.attempt(options, value, context, false);
      if (
        exact.isValid ||
        context.options.coerce !== true ||
        value === undefined ||
        value === null
      ) {
        return exact.isValid ? exact : UnionValidatorFactory.noMatch(exact.attempts);
      }
      const coerced = UnionValidatorFactory.attempt(options, value, context, true);
      return coerced.isValid ? coerced : UnionValidatorFactory.noMatch(coerced.attempts);
    };
  }

  /**
   * Tries options in order, retaining failures until one accepts the value.
   * @param options Ordered alternative validators and coercers.
   * @param value Candidate value supplied to each option.
   * @param context Per-parse options and nesting depth.
   * @param isCoerced Whether each candidate is coerced before its validation.
   * @returns First success and prior failures, or all failures when no option matches.
   */
  private static attempt(
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

  /**
   * Builds the `invalid_union` rejection from all attempted option failures.
   * @param attempts Failures grouped by option in declaration order.
   * @returns Rejected value outcome with serialisable issue details.
   */
  private static noMatch(attempts: readonly (readonly IValueFailure[])[]): IValueOutcome {
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

  /**
   * Builds an `invalid_discriminator` failure at the discriminator property.
   * @param discriminator Property name used to select the variant.
   * @param expected Allowed discriminator strings.
   * @param received Actual discriminator value, possibly undefined.
   * @returns Failure carrying expected and received discriminator details.
   */
  private static discriminatorFailure(
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
