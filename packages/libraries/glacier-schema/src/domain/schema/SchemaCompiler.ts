import type { IClass } from "@glacier/reflection";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import type { ICompiledSchema } from "./CompiledSchemaCache.js";
import { FieldRegistry } from "./FieldRegistry.js";
import type { ISchemaIssue } from "../failures/ISchemaIssue.js";
import { ReceivedType } from "../validation/ReceivedType.js";
import { ValueValidatorFactory } from "../validation/ValueValidatorFactory.js";
import type { IValueValidator } from "../validation/ValueValidatorFactory.js";

interface ICompiledField {
  readonly key: string;
  readonly message: string | undefined;
  readonly validate: IValueValidator;
}

/** Compiles a decorated class into a cached validate-and-instantiate closure, without `eval`. */
export class SchemaCompiler {
  /**
   * Returns the closure for `target`, compiling it on first use. Compiling freezes the metadata of the
   * class and its ancestors, so decorating them afterwards throws `SchemaDefinitionError`.
   */
  public static compile<T extends object>(target: IClass): ICompiledSchema<T> {
    const cached = CompiledSchemaCache.get<T>(target);
    if (cached !== undefined) return cached;
    CompiledSchemaCache.freeze(target);
    const fields: readonly ICompiledField[] = FieldRegistry.readAll(target).map((definition) => ({
      key: definition.name,
      message: definition.message,
      validate: ValueValidatorFactory.create(definition.type),
    }));
    const schema = SchemaCompiler.#build<T>(target, fields);
    CompiledSchemaCache.set(target, schema);
    return schema;
  }

  /** Builds the closure; the instance never runs the constructor and receives only declared fields. */
  static #build<T extends object>(
    target: IClass,
    fields: readonly ICompiledField[],
  ): ICompiledSchema<T> {
    return (input) => {
      if (typeof input !== "object" || input === null || Array.isArray(input)) {
        const received = ReceivedType.describe(input);
        return {
          ok: false,
          issues: [
            {
              path: [],
              code: "invalid_type",
              message: `Expected object, received ${received}`,
              params: { expected: "object", received },
            },
          ],
        };
      }
      const issues: ISchemaIssue[] = [];
      const instance: T = Object.create(target.prototype);
      for (const field of fields) {
        const raw = Object.hasOwn(input, field.key) ? Reflect.get(input, field.key) : undefined;
        const outcome = field.validate(raw);
        if (!outcome.isValid) {
          issues.push({
            path: [field.key],
            code: outcome.failure.code,
            message: field.message ?? outcome.failure.message,
            params: outcome.failure.params,
          });
        } else if (outcome.value !== undefined) {
          Object.defineProperty(instance, field.key, {
            value: outcome.value,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        }
      }
      return issues.length === 0 ? { ok: true, value: instance } : { ok: false, issues };
    };
  }
}
