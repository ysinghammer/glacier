import type { IFieldDefinition } from "../schema/IFieldDefinition.js";
import type { IRefinement } from "../schema/IRefinement.js";
import type { IParseContext } from "./IParseContext.js";
import type { IValueOutcome } from "./IValueOutcome.js";
import { ValueCoercer } from "./ValueCoercer.js";
import { ValueValidatorFactory } from "./ValueValidatorFactory.js";

/** Runs the whole per-field pipeline on a raw input value; created once per field at compile time. */
export type IFieldProcessor = (raw: unknown, context: IParseContext) => IValueOutcome;

/** Builds the pipeline coerce, default, transform, optional/nullable shortcuts, validate for a field. */
export class FieldProcessorFactory {
  /**
   * Returns the processor for `definition`. An accepted `undefined` outcome means the key stays absent.
   * `Optional` only short-circuits `undefined` and `Nullable` only `null`; every other value, and any
   * `undefined` or `null` the modifiers do not permit, goes to the type validator.
   */
  public static create(definition: IFieldDefinition): IFieldProcessor {
    const { optional, nullable, defaultValue, transform, refine } = definition.modifiers;
    const coerce = ValueCoercer.create(definition.type);
    const validate = ValueValidatorFactory.create(definition.type);
    return (raw, context) => {
      let value = raw;
      if (context.options.coerce === true && value !== undefined && value !== null)
        value = coerce(value);
      if (value === undefined && defaultValue !== undefined) value = defaultValue();
      if (value !== undefined && transform !== undefined) {
        try {
          value = transform(value);
        } catch (error) {
          return FieldProcessorFactory.#transformFailure(error);
        }
      }
      if (value === undefined && optional === true) return { isValid: true, value };
      if (value === null && nullable === true) return { isValid: true, value };
      const outcome = validate(value, context);
      if (!outcome.isValid || refine === undefined) return outcome;
      return FieldProcessorFactory.#refine(outcome, refine);
    };
  }

  /** Applies the property refinement to a valid outcome. */
  static #refine(outcome: IValueOutcome, refine: IRefinement): IValueOutcome {
    if (!outcome.isValid || outcome.value === undefined) return outcome;
    const message = refine.message ?? "Refinement failed";
    try {
      if (refine.test(outcome.value)) return outcome;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        failures: [{ code: "custom", message, params: { reason }, hasOwnMessage: true }],
      };
    }
    return {
      isValid: false,
      failures: [{ code: "custom", message, params: {}, hasOwnMessage: true }],
    };
  }

  /** Reports an exception thrown by a transform function. */
  static #transformFailure(error: unknown): IValueOutcome {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      failures: [{ code: "transform_failed", message: "Transform failed", params: { reason } }],
    };
  }
}
