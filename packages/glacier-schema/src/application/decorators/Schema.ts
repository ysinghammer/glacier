import { reflect } from '@glacier/reflection';

import { DecoratorSchema } from '../interfaces/DecoratorSchema';

/**
 * Unique metadata key for storing schema information.
 */
export const schemaMetadataKey = Symbol('[[SCHEMA]]');

/**
 * Schema decorator to define schema metadata for a class property.
 * @param schema - The schema definition object.
 */
export function Schema(schema: DecoratorSchema): PropertyDecorator {
  return (target, propertyKey) => {
    reflect.defineMetadata(schemaMetadataKey, schema, target, propertyKey);
  };
}
