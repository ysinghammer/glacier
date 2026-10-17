import type { IClass } from "@glacier/reflection";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import type { ICompiledSchema } from "./CompiledSchemaCache.js";
import { FieldRegistry } from "./FieldRegistry.js";
import type { ISchemaIssue } from "../failures/ISchemaIssue.js";
import { ReceivedType } from "../validation/ReceivedType.js";
import { FieldProcessorFactory } from "../validation/FieldProcessorFactory.js";
import type { IFieldProcessor } from "../validation/FieldProcessorFactory.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";

interface ICompiledField {
  /** Property name on the instance. */
  readonly key: string;
  /** Key read from the input, which differs from `key` for renamed fields. */
  readonly inputKey: string;
  readonly message: string | undefined;
  readonly process: IFieldProcessor;
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
      inputKey: definition.modifiers.inputKey ?? definition.name,
      message: definition.message,
      process: FieldProcessorFactory.create(definition),
    }));
    SchemaCompiler.#assertDistinctInputKeys(target, fields);
    const schema = SchemaCompiler.#build<T>(target, fields);
    CompiledSchemaCache.set(target, schema);
    return schema;
  }

  /** Rejects classes in which two fields would read the same input key. */
  static #assertDistinctInputKeys(target: IClass, fields: readonly ICompiledField[]): void {
    const owners = new Map<string, string>();
    for (const field of fields) {
      const first = owners.get(field.inputKey);
      if (first !== undefined) {
        throw new SchemaDefinitionError(
          `${target.name}.${field.key} and ${target.name}.${first} both read input key ${field.inputKey}`,
        );
      }
      owners.set(field.inputKey, field.key);
    }
  }

  /** Builds the closure; the instance never runs the constructor and receives only declared fields. */
  static #build<T extends object>(
    target: IClass,
    fields: readonly ICompiledField[],
  ): ICompiledSchema<T> {
    return (input, options) => {
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
        const raw = Object.hasOwn(input, field.inputKey)
          ? Reflect.get(input, field.inputKey)
          : undefined;
        const outcome = field.process(raw, options);
        if (!outcome.isValid) {
          issues.push({
            path: [field.inputKey],
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
