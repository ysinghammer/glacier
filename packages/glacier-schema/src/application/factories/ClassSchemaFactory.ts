import { reflect } from '@glacier/reflection';
import { MetadataTarget } from '@glacier/reflection/src/domain/interfaces/MetadataTarget';
import { Constructor } from '@glacier/utils';

import { Schema } from '../../domain/entities/Schema';
import { ObjectSchema } from '../../domain/entities/schemas/ObjectSchema';
import { schemaMetadataKey } from '../decorators/Schema';
import { DecoratorSchema } from '../interfaces/DecoratorSchema';
import { ArraySchema } from '../../domain/entities/schemas/ArraySchema';
import { BooleanSchema } from '../../domain/entities/schemas/BooleanSchema';
import { StringSchema } from '../../domain/entities/schemas/StringSchema';
import { ConstSchema } from '../../domain/entities/schemas/ConstSchema';
import { EnumSchema } from '../../domain/entities/schemas/EnumSchema';
import { NumberSchema } from '../../domain/entities/schemas/NumberSchema';
import { IntegerSchema } from '../../domain/entities/schemas/IntegerSchema';
import { MapSchema } from '../../domain/entities/schemas/MapSchema';
import { NullSchema } from '../../domain/entities/schemas/NullSchema';
import { SetSchema } from '../../domain/entities/schemas/SetSchema';
import { TupleSchema } from '../../domain/entities/schemas/TupleSchema';
import { UnionSchema } from '../../domain/entities/schemas/UnionSchema';
import { StringDecorator } from '../interfaces/decoratorSchema/StringDecorator';
import { TupleDecorator } from '../interfaces/decoratorSchema/TupleDecorator';
import { UnionDecorator } from '../interfaces/decoratorSchema/UnionDecorator';
import { SetDecorator } from '../interfaces/decoratorSchema/SetDecorator';
import { ObjectDecorator } from '../interfaces/decoratorSchema/ObjectDecorator';
import { NumberDecorator } from '../interfaces/decoratorSchema/NumberDecorator';
import { MapDecorator } from '../interfaces/decoratorSchema/MapDecorator';
import { IntegerDecorator } from '../interfaces/decoratorSchema/IntegerDecorator';
import { EnumDecorator } from '../interfaces/decoratorSchema/EnumDecorator';
import { ConstDecorator } from '../interfaces/decoratorSchema/ConstDecorator';
import { ArrayDecorator } from '../interfaces/decoratorSchema/ArrayDecorator';

export class ClassSchemaFactory {
  public static createSchema<const T>(cls: Constructor<T>): Schema<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --- Type assertion is safe here as we ensure properties match T
    return this.createObjectSchema({ type: cls }) as Schema<T>;
  }

  private static processSchema(schema: DecoratorSchema): Schema {
    if ('type' in schema) {
      if (schema.type === 'array') {
        if (!schema.items && 'prefixItems' in schema) {
          return this.createTupleSchema(schema);
        }
        if ('uniqueItems' in schema) {
          return this.createSetSchema(schema);
        }
        return this.createArraySchema(schema);
      }
      if (schema.type === 'boolean') return this.createBooleanSchema();
      if (schema.type === 'string') return this.createStringSchema(schema);
      if (schema.type === 'integer') return this.createIntegerSchema(schema);
      if (schema.type === 'null') return this.createNullSchema();
      if (schema.type === 'number') return this.createNumberSchema(schema);
      if ('additionalProperties' in schema) {
        return this.createMapSchema(schema);
      }
      if (typeof schema.type === 'function') {
        return this.createObjectSchema(schema);
      }
    }
    if ('oneOf' in schema) return this.createUnionSchema(schema);
    if ('enum' in schema) return this.createEnumSchema(schema);
    if ('const' in schema) return this.createConstSchema(schema);

    throw new Error('Unsupported schema type');
  }

  private static createArraySchema(schema: ArrayDecorator) {
    const itemSchema = this.processSchema(schema.items);
    const arraySchema = new ArraySchema(itemSchema);
    if (schema.maxItems) arraySchema.setMaxItems(schema.maxItems);
    if (schema.minItems) arraySchema.setMinItems(schema.minItems);
    return arraySchema;
  }

  private static createBooleanSchema(): BooleanSchema {
    return new BooleanSchema();
  }

  private static createStringSchema(schema: StringDecorator): StringSchema {
    const stringSchema = new StringSchema();
    if (schema.minLength) stringSchema.setMinLength(schema.minLength);
    if (schema.maxLength) stringSchema.setMaxLength(schema.maxLength);
    if (schema.pattern) stringSchema.setPattern(new RegExp(schema.pattern));
    return stringSchema;
  }

  private static createConstSchema(schema: ConstDecorator) {
    return new ConstSchema(schema.const);
  }

  private static createEnumSchema(schema: EnumDecorator) {
    return new EnumSchema(schema.enum);
  }

  private static createIntegerSchema(schema: IntegerDecorator): NumberSchema {
    const integerSchema = new IntegerSchema();
    if (schema.minimum !== undefined) integerSchema.setMinimum(schema.minimum);
    if (schema.maximum !== undefined) integerSchema.setMaximum(schema.maximum);
    return integerSchema;
  }

  private static createMapSchema(schema: MapDecorator) {
    const valueSchema = this.processSchema(schema.additionalProperties);
    const mapSchema = new MapSchema(valueSchema);
    if (schema.minProperties) mapSchema.setMinProperties(schema.minProperties);
    if (schema.maxProperties) mapSchema.setMaxProperties(schema.maxProperties);
    return mapSchema;
  }

  private static createNullSchema(): NullSchema {
    return new NullSchema();
  }

  private static createNumberSchema(schema: NumberDecorator): NumberSchema {
    const numberSchema = new NumberSchema();
    if (schema.minimum !== undefined) numberSchema.setMinimum(schema.minimum);
    if (schema.maximum !== undefined) numberSchema.setMaximum(schema.maximum);
    return numberSchema;
  }

  private static createObjectSchema(schema: ObjectDecorator): ObjectSchema {
    const targetPrototype: MetadataTarget = schema.type.prototype;
    const propertyKeys = reflect.getPropertyKeys(targetPrototype);
    const properties: Record<string, Schema> = {};
    const requiredProperties: string[] = [];

    propertyKeys.forEach((propertyKey) => {
      if (typeof propertyKey === 'symbol') {
        throw new Error('Symbol properties are not supported in ClassSchemaFactory.');
      }
      const propertySchema = reflect.getMetadata<DecoratorSchema>(
        schemaMetadataKey,
        targetPrototype,
        propertyKey
      );
      if (typeof propertySchema === 'undefined') return;
      if (!propertySchema.optional) {
        requiredProperties.push(propertyKey);
      }
      properties[propertyKey] = this.processSchema(propertySchema);
    });

    return new ObjectSchema(properties, requiredProperties);
  }

  private static createSetSchema(schema: SetDecorator) {
    const itemSchema = this.processSchema(schema.items);
    const setSchema = new SetSchema(itemSchema);
    if (schema.maxItems) setSchema.setMaxItems(schema.maxItems);
    if (schema.minItems) setSchema.setMinItems(schema.minItems);
    return setSchema;
  }

  private static createTupleSchema(schema: TupleDecorator) {
    const itemSchemas = schema.prefixItems.map((itemSchema) => this.processSchema(itemSchema));
    return new TupleSchema(itemSchemas);
  }

  private static createUnionSchema(schema: UnionDecorator) {
    const optionSchemas = schema.oneOf.map((optionSchema) => this.createObjectSchema(optionSchema));
    return new UnionSchema(optionSchemas);
  }
}
