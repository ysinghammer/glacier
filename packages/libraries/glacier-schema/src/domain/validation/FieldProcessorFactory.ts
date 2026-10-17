import type { IFieldDefinition } from "../schema/IFieldDefinition.js";
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
    const { optional, nullable, defaultValue, transform } = definition.modifiers;
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
      return validate(value, context);
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
