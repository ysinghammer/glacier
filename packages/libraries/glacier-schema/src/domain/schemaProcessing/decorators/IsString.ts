import { FieldRegistry } from "../schema/FieldRegistry.js";
import { RuleDefinitionCheck } from "../schema/RuleDefinitionCheck.js";
import type { IStringOptions } from "./types/IStringOptions.js";

/**
 * Declares a string field and records its validation rules as schema metadata.
 * @param options Optional string constraints, normalisations and issue message.
 * @returns A property decorator that registers the string field.
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
