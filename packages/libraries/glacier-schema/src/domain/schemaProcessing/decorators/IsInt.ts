import { FieldRegistry } from "../schema/FieldRegistry.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { INumberOptions } from "./types/INumberOptions.js";

/**
 * Declares a finite integer field and records its numeric constraints as schema metadata.
 * @param options Optional numeric bounds, divisibility constraint and issue message.
 * @returns A property decorator that registers the integer field.
 */
export function IsInt(options?: INumberOptions): PropertyDecorator {
  const { message, ...rules } = options ?? {};
  return (target, key) => {
    RuleDefinitionCheck.number(`${target.constructor.name}.${String(key)}`, rules);
    FieldRegistry.declare(
      target,
      key,
      { kind: "int", rules },
      message === undefined ? undefined : { message },
    );
  };
}
