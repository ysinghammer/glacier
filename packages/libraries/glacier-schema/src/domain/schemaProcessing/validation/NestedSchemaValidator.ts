import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { ICompiledSchema } from "../schema/CompiledSchemaCache.js";
import { SchemaCompiler } from "../schema/SchemaCompiler.js";
import type { IValueValidator } from "./ValueValidatorFactory.js";
import { TypeFailure } from "./TypeFailure.js";

/** Builds the validator of a field whose value is another decorated class. */
export class NestedSchemaValidator {
  /**
   * Returns a validator that parses the value with the schema of the class `resolve` returns. The class is
   * resolved and compiled on first use, so forward references and cycles work; a result that is not a class
   * throws `SchemaDefinitionError` then. Issues of the nested schema keep their own messages and are
   * located by their path inside the value; the nested schema runs `levelStep` (default one) levels deeper; a union selecting the root class passes 0.
   */
  public static create(resolve: () => unknown, levelStep = 1): IValueValidator {
    let schema: ICompiledSchema<object> | undefined;
    return (value, context) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { isValid: false, failures: [TypeFailure.invalidType("object", value)] };
      }
      schema ??= NestedSchemaValidator.#compile(resolve);
      const result = schema(value, { options: context.options, depth: context.depth + levelStep });
      if (result.ok) return { isValid: true, value: result.value };
      return {
        isValid: false,
        failures: result.issues.map((issue) => ({ ...issue, hasOwnMessage: true })),
      };
    };
  }

  /** Resolves the reference and compiles the class it names. */
  static #compile(resolve: () => unknown): ICompiledSchema<object> {
    const target = resolve();
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("A lazy object reference did not resolve to a class");
    }
    return SchemaCompiler.compile<object>(target as IClass);
  }
}
