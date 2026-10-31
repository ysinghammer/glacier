import type { IClass } from "@glacier/reflection";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import { UnionSpecs } from "../schema/UnionSpecs.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { ISchemaDecoratorOptions } from "./types/ISchemaDecoratorOptions.js";
import type { IUnionOptions } from "./types/IUnionOptions.js";

/**
 * Declares a discriminated union field or base class using an explicit variant mapping.
 * @param config Discriminator property and non-empty mapping from discriminator values to classes.
 * @param options Optional message override for discriminator issues.
 * @returns A class and property decorator that records the union declaration.
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
