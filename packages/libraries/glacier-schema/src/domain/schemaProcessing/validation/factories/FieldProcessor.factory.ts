import type { IFieldDefinition } from "../../schema/types/IFieldDefinition.js";
import type { IRefinement } from "../../schema/types/IRefinement.js";
import type { IParseContext } from "../types/IParseContext.js";
import type { IValueOutcome } from "../types/IValueOutcome.js";
import { ValueCoercer } from "../ValueCoercer.js";
import { ValueValidatorFactory } from "./ValueValidator.factory.js";

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
    return (raw, context) =>
      FieldProcessorFactory.process(
        raw,
        context,
        { optional, nullable, defaultValue, transform, refine },
        coerce,
        validate,
      );
  }

  private static process(
    raw: unknown,
    context: IParseContext,
    modifiers: {
      readonly optional: IFieldDefinition["modifiers"]["optional"];
      readonly nullable: IFieldDefinition["modifiers"]["nullable"];
      readonly defaultValue: IFieldDefinition["modifiers"]["defaultValue"];
      readonly transform: IFieldDefinition["modifiers"]["transform"];
      readonly refine: IFieldDefinition["modifiers"]["refine"];
    },
    coerce: (value: unknown) => unknown,
    validate: ReturnType<typeof ValueValidatorFactory.create>,
  ): IValueOutcome {
    const value = FieldProcessorFactory.transform(
      raw,
      context,
      modifiers.defaultValue,
      modifiers.transform,
      coerce,
    );
    if (FieldProcessorFactory.isTransformFailure(value)) return value.outcome;
    if (value.value === undefined && modifiers.optional === true)
      return { isValid: true, value: value.value };
    if (value.value === null && modifiers.nullable === true)
      return { isValid: true, value: value.value };
    const outcome = validate(value.value, context);
    if (!outcome.isValid || modifiers.refine === undefined) return outcome;
    return FieldProcessorFactory.refine(outcome, modifiers.refine);
  }

  private static transform(
    raw: unknown,
    context: IParseContext,
    defaultValue: IFieldDefinition["modifiers"]["defaultValue"],
    transform: IFieldDefinition["modifiers"]["transform"],
    coerce: (value: unknown) => unknown,
  ): { readonly value: unknown } | { readonly outcome: IValueOutcome } {
    let value = raw;
    if (context.options.coerce === true && value !== undefined && value !== null)
      value = coerce(value);
    if (value === undefined && defaultValue !== undefined) value = defaultValue();
    if (value !== undefined && transform !== undefined) {
      try {
        value = transform(value);
      } catch (error) {
        return { outcome: FieldProcessorFactory.transformFailure(error) };
      }
    }
    return { value };
  }

  private static isTransformFailure(
    result: { readonly value: unknown } | { readonly outcome: IValueOutcome },
  ): result is { readonly outcome: IValueOutcome } {
    return "outcome" in result;
  }

  /** Applies the property refinement to a valid outcome. */
  private static refine(outcome: IValueOutcome, refine: IRefinement): IValueOutcome {
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
  private static transformFailure(error: unknown): IValueOutcome {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      failures: [{ code: "transform_failed", message: "Transform failed", params: { reason } }],
    };
  }
}
