import { UnsupportedSchemaError } from '../_exceptions/UnsupportedSchemaError.js';
import { ClosedObjectCompiler } from './ClosedObjectCompiler.js';
import { combineValidators } from './_functions/combineValidators.js';
import { compileTypeCheck } from './_functions/compileTypeCheck.js';
import { isPlainObjectValue } from './_functions/isPlainObjectValue.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IValidationError } from '../_interfaces/IValidationError.js';
import type { IStringSchemaNode } from '../../definition/_interfaces/IStringSchemaNode.js';
import type { TObjectSchemaNode } from '../../definition/TObjectSchemaNode.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles every keyword that applies to a `{ type: "object" }` schema
 * node, dispatching closed-object validation to `ClosedObjectCompiler`.
 * Delegates nested schema compilation back through `compileNested` to
 * avoid a circular import with `SchemaCompiler`.
 */
export class ObjectKeywordCompiler {
  /** Compiles a `TObjectSchemaNode` into a single combined validator. */
  public static compile(
    node: TObjectSchemaNode,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const checks: ICompiledValidator[] = [compileTypeCheck('object', isPlainObjectValue)];
    if (node.properties !== undefined) {
      if (
        node.additionalProperties !== undefined &&
        (node.additionalProperties as unknown) !== false
      ) {
        throw new UnsupportedSchemaError(
          '`properties` cannot be combined with a schema-valued or `true` `additionalProperties`'
        );
      }
      checks.push(ClosedObjectCompiler.compile(node, compileNested));
    } else if (node.additionalProperties !== undefined) {
      checks.push(
        ObjectKeywordCompiler.compileAdditionalProperties(node.additionalProperties, compileNested)
      );
    }
    if (node.propertyNames !== undefined) {
      checks.push(ObjectKeywordCompiler.compilePropertyNames(node.propertyNames, compileNested));
    }
    return combineValidators(checks);
  }

  private static compileAdditionalProperties(
    schemaOrTrue: TSchemaLike | true,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    if (schemaOrTrue === true) {
      return () => [];
    }
    const validator = compileNested(schemaOrTrue);
    return (value, path) => {
      if (!isPlainObjectValue(value)) return [];
      const errors: IValidationError[] = [];
      for (const [key, rawValue] of Object.entries(value)) {
        errors.push(...validator(rawValue, [...path, key]));
      }
      return errors;
    };
  }

  private static compilePropertyNames(
    schema: IStringSchemaNode,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const validator = compileNested(schema);
    return (value, path) => {
      if (!isPlainObjectValue(value)) return [];
      return Object.keys(value).flatMap((key) => validator(key, [...path, key]));
    };
  }
}
