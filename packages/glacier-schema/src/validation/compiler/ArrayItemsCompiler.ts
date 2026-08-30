import { isArrayValue } from './_functions/isArrayValue.js';
import type { ICompiledValidator } from './_interfaces/ICompiledValidator.js';
import type { IValidationError } from '../_interfaces/IValidationError.js';
import type { TSchemaLike } from '../../definition/TSchemaLike.js';

/**
 * Compiles the `prefixItems`/`items` array keywords. Delegates nested
 * schema compilation back through `compileNested` to avoid a circular
 * import with `SchemaCompiler`.
 */
export class ArrayItemsCompiler {
  /** Compiles `prefixItems` (tuple-positional) plus an optional rest `items` schema. */
  public static compilePrefixItems(
    prefixItems: readonly TSchemaLike[],
    items: TSchemaLike | undefined,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const prefixValidators = prefixItems.map((schema) => compileNested(schema));
    const restValidator = items === undefined ? undefined : compileNested(items);
    return (value, path) => {
      if (!isArrayValue(value)) return [];
      const errors: IValidationError[] = [];
      prefixValidators.forEach((validator, index) => {
        if (index < value.length) {
          errors.push(...validator(value[index], [...path, index]));
        }
      });
      if (restValidator !== undefined) {
        for (let index = prefixValidators.length; index < value.length; index += 1) {
          errors.push(...restValidator(value[index], [...path, index]));
        }
      }
      return errors;
    };
  }

  /** Compiles a homogeneous `items` schema applied to every array element. */
  public static compileItems(
    items: TSchemaLike,
    compileNested: (schema: TSchemaLike) => ICompiledValidator
  ): ICompiledValidator {
    const validator = compileNested(items);
    return (value, path) => {
      if (!isArrayValue(value)) return [];
      return value.flatMap((item, index) => validator(item, [...path, index]));
    };
  }
}
