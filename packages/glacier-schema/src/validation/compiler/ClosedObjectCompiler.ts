import { isPlainObjectValue } from './_functions/isPlainObjectValue.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IValidationError } from '../_interfaces/IValidationError.js';
import type { IClosedObjectSchemaNode } from '../../definition/_interfaces/IClosedObjectSchemaNode.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles a closed object node's `properties`/`required` keywords,
 * rejecting any property not explicitly listed. Delegates nested schema
 * compilation back through `compileNested` to avoid a circular import
 * with `SchemaCompiler`.
 */
export class ClosedObjectCompiler {
  /** Compiles an `IClosedObjectSchemaNode` into a single combined validator. */
  public static compile(
    node: IClosedObjectSchemaNode,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const propertyValidators = new Map<string, ICompiledValidator>(
      Object.entries(node.properties).map(([key, schema]) => [key, compileNested(schema)])
    );
    const required = node.required ?? [];
    const allowedKeys = new Set(Object.keys(node.properties));
    return (value, path) => {
      if (!isPlainObjectValue(value)) return [];
      const errors: IValidationError[] = [];
      for (const key of required) {
        if (!(key in value)) {
          errors.push({
            path: [...path, key],
            keyword: 'required',
            message: `must have required property "${key}"`,
            params: { missingProperty: key }
          });
        }
      }
      for (const [key, rawValue] of Object.entries(value)) {
        if (!allowedKeys.has(key)) {
          errors.push({
            path: [...path, key],
            keyword: 'additionalProperties',
            message: `must not have additional property "${key}"`,
            params: { additionalProperty: key }
          });
          continue;
        }
        const validator = propertyValidators.get(key);
        if (validator !== undefined) {
          errors.push(...validator(rawValue, [...path, key]));
        }
      }
      return errors;
    };
  }
}
