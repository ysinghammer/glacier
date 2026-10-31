import { FieldRegistry } from "../schema/FieldRegistry.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { IStringOptions } from "./IStringOptions.js";

/**
 * Property decorator declaring that the field must be a string. Accepts the constraints of its options (checked for consistency when decorating). Records metadata only; throws
 * `SchemaDefinitionError` when the property's emitted TypeScript type contradicts it or it already has a type decorator.
 */
export function IsString(options?: IStringOptions): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, key) => {
    RuleDefinitionCheck.string(`${target.constructor.name}.${String(key)}`, rules);
    FieldRegistry.declare(
      target,
      key,
      { kind: "string", rules },
      message === undefined ? undefined : { message },
    );
  };
}
