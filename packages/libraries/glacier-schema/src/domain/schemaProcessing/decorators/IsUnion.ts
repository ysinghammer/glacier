import type { IClass } from "@glacier/reflection";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import { UnionSpecs } from "../schema/UnionSpecs.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { ISchemaDecoratorOptions } from "./ISchemaDecoratorOptions.js";
import type { IUnionOptions } from "./IUnionOptions.js";

/**
 * Decorator declaring a discriminated union with an explicit discriminator-to-class mapping. On a property
 * the field must be an object whose `discriminator` value selects the variant class, which then validates
 * and instantiates the whole value; issues point into the variant. On a base class, parsing the base
 * itself selects the variant the same way (subclasses do not inherit this). An unknown or missing
 * discriminator is `invalid_discriminator`. `message` replaces the message of discriminator issues only.
 * Records metadata only; throws `SchemaDefinitionError` for an invalid mapping, a base class listing
 * itself as a variant, or a property that already has a type decorator.
 */
export function IsUnion(
  config: IUnionOptions,
  options?: ISchemaDecoratorOptions,
): ClassDecorator & PropertyDecorator {
  return (target: object, key?: string | symbol): void => {
    if (key !== undefined) {
      const label = `${target.constructor.name}.${String(key)}`;
      FieldRegistry.declare(target, key, UnionSpecs.discriminated(config, label), options);
      return;
    }
    const base = target as IClass;
    const spec = UnionSpecs.discriminated(config, base.name);
    if (UnionSpecs.hasDirectVariant(spec, base)) {
      throw new SchemaDefinitionError(
        `${base.name}: IsUnion cannot list the class as its own variant`,
      );
    }
    UnionRegistry.declare(base, { spec, message: options?.message });
  };
}
