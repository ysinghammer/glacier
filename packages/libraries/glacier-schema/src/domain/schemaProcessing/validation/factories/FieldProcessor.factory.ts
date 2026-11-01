import type { IFieldDefinition } from "../../schema/types/IFieldDefinition.js";
import type { IRefinement } from "../../schema/types/IRefinement.js";
import type { IParseContext } from "../types/IParseContext.js";
import type { IValueOutcome } from "../types/IValueOutcome.js";
import { ValueCoercer } from "../ValueCoercer.js";
import { ValueValidatorFactory } from "./ValueValidator.factory.js";

/**
 * Processes one raw field value through coercion, modifiers, validation and refinement.
 * @param raw Input value read for the field, or undefined when absent.
 * @param context Per-parse options and nesting depth.
 * @returns Accepted transformed value or typed failures.
 */
export type IFieldProcessor = (raw: unknown, context: IParseContext) => IValueOutcome;

/** Builds the pipeline coerce, default, transform, optional/nullable shortcuts, validate for a field. */
export class FieldProcessorFactory {
  /**
   * Builds a processor closure for one compiled field definition.
   * @param definition Declared field type, issue message and effective modifiers.
   * @returns Reusable processor applying the field pipeline in fixed order.
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

  /**
   * Runs the field pipeline and applies optional, nullable and refinement behavior.
   * @param raw Raw field input, possibly undefined.
   * @param context Per-parse options and nesting depth.
   * @param modifiers Field modifiers relevant to processing.
   * @param coerce Coercer associated with the declared type.
   * @param validate Validator associated with the declared type.
   * @returns Accepted value or typed processing failures.
   */
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

  /**
   * Applies coercion, defaulting and the optional transform in pipeline order.
   * @param raw Raw field input.
   * @param context Per-parse options controlling coercion.
   * @param defaultValue Optional default factory used for undefined input.
   * @param transform Optional user transform applied to present values.
   * @param coerce Type-specific coercer.
   * @returns Transformed value, or a failure outcome when a transform throws.
   */
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

  /**
   * Narrows a transform result to its failure variant.
   * @param result Value-or-outcome result from the transform stage.
   * @returns True when the result contains a failure outcome.
   */
  private static isTransformFailure(
    result: { readonly value: unknown } | { readonly outcome: IValueOutcome },
  ): result is { readonly outcome: IValueOutcome } {
    return "outcome" in result;
  }

  /**
   * Applies a property refinement to a successfully validated value.
   * @param outcome Successful value outcome from type validation.
   * @param refine Synchronous predicate and optional issue message.
   * @returns Original success or a custom refinement failure.
   */
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

  /**
   * Converts a transform exception into a typed validation failure.
   * @param error Thrown value captured from the transform callback.
   * @returns Rejected outcome with a safe reason parameter.
   */
  private static transformFailure(error: unknown): IValueOutcome {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      failures: [{ code: "transform_failed", message: "Transform failed", params: { reason } }],
    };
  }
}
