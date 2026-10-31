import { FieldRegistry } from "../schema/FieldRegistry.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { INumberOptions } from "./INumberOptions.js";

/**
 * Property decorator declaring that the field must be a finite number. Accepts the constraints of its options (checked for consistency when decorating). Records metadata only; throws
 * `SchemaDefinitionError` when the property's emitted TypeScript type contradicts it or it already has a type decorator.
 */
export function IsNumber(options?: INumberOptions): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, key) => {
    RuleDefinitionCheck.number(`${target.constructor.name}.${String(key)}`, rules);
    FieldRegistry.declare(
      target,
      key,
      { kind: "number", rules },
      message === undefined ? undefined : { message },
    );
  };
}
