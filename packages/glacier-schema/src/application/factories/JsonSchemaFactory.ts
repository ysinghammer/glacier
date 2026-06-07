import { SchemaJson } from '../interfaces/SchemaJson';
import { ArraySchema } from '../../domain/entities/schemas/ArraySchema';
import { ArraySchemaJson } from '../interfaces/schemas/ArraySchemaJson';
import { BooleanSchema } from '../../domain/entities/schemas/BooleanSchema';
import { StringSchema } from '../../domain/entities/schemas/StringSchema';
import { StringSchemaJson } from '../interfaces/schemas/StringSchemaJson';
import { ConstSchemaJson } from '../interfaces/schemas/ConstSchemaJson';
import { ConstSchema } from '../../domain/entities/schemas/ConstSchema';
import { EnumSchemaJson } from '../interfaces/schemas/EnumSchemaJson';
import { EnumSchema } from '../../domain/entities/schemas/EnumSchema';
import { IntegerSchemaJson } from '../interfaces/schemas/IntegerSchemaJson';
import { IntegerSchema } from '../../domain/entities/schemas/IntegerSchema';
import { MapSchemaJson } from '../interfaces/schemas/MapSchemaJson';
import { MapSchema } from '../../domain/entities/schemas/MapSchema';
import { NullSchema } from '../../domain/entities/schemas/NullSchema';
import { NumberSchemaJson } from '../interfaces/schemas/NumberSchemaJson';
import { NumberSchema } from '../../domain/entities/schemas/NumberSchema';
import { ObjectSchema } from '../../domain/entities/schemas/ObjectSchema';
import { ObjectSchemaJson } from '../interfaces/schemas/ObjectSchemaJson';
import { UnionSchema } from '../../domain/entities/schemas/UnionSchema';
import { TupleSchema } from '../../domain/entities/schemas/TupleSchema';
import { SetSchema } from '../../domain/entities/schemas/SetSchema';
import { SetSchemaJson } from '../interfaces/schemas/SetSchemaJson';
import { TupleSchemaJson } from '../interfaces/schemas/TupleSchemaJson';
import { UnionSchemaJson } from '../interfaces/schemas/UnionSchemaJson';
import { InferArraySchema } from '../interfaces/inferSchemas/InferArraySchema';
import { InferConstSchema } from '../interfaces/inferSchemas/InferConstSchema';
import { InferMapSchema } from '../interfaces/inferSchemas/InferMapSchema';
import { InferObjectSchema } from '../interfaces/inferSchemas/InferObjectSchema';
import { InferSetSchema } from '../interfaces/inferSchemas/InferSetSchema';
import { InferTupleSchema } from '../interfaces/inferSchemas/InferTupleSchema';
import { InferUnionSchema } from '../interfaces/inferSchemas/InferUnionSchema';
import { InferEnumSchema } from '../interfaces/inferSchemas/InferEnumSchema';
import { InferBooleanSchema } from '../interfaces/inferSchemas/InferBooleanSchema';
import { InferNumberSchema } from '../interfaces/inferSchemas/InferNumberSchema';
import { InferIntegerSchema } from '../interfaces/inferSchemas/InferIntegerSchema';
import { InferNullSchema } from '../interfaces/inferSchemas/InferNullSchema';
import { InferStringSchema } from '../interfaces/inferSchemas/InferStringSchema';
import { NullSchemaJson } from '../interfaces/schemas/NullSchemaJson';
import { BooleanSchemaJson } from '../interfaces/schemas/BooleanSchemaJson';
import { Schema } from '../../domain/entities/Schema';
import { InferSchema } from '../interfaces/InferSchema';

export class JsonSchemaFactory {
  public static createSchema(schema: BooleanSchemaJson): InferBooleanSchema;
  public static createSchema(schema: NumberSchemaJson): InferNumberSchema;
  public static createSchema(schema: IntegerSchemaJson): InferIntegerSchema;
  public static createSchema(schema: NullSchemaJson): InferNullSchema;
  public static createSchema(schema: StringSchemaJson): InferStringSchema;
  public static createSchema<S extends ConstSchemaJson>(schema: S): InferConstSchema<S>;
  public static createSchema<S extends EnumSchemaJson>(schema: S): InferEnumSchema<S>;
  public static createSchema<S extends ArraySchemaJson>(schema: S): InferArraySchema<S>;
  public static createSchema<S extends MapSchemaJson>(schema: S): InferMapSchema<S>;
  public static createSchema<S extends ObjectSchemaJson>(schema: S): InferObjectSchema<S>;
  public static createSchema<S extends SetSchemaJson>(schema: S): InferSetSchema<S>;
  public static createSchema<S extends TupleSchemaJson>(schema: S): InferTupleSchema<S>;
  public static createSchema<S extends UnionSchemaJson>(schema: S): InferUnionSchema<S>;
  public static createSchema<S extends SchemaJson>(schema: S): InferSchema<S>;
  public static createSchema(schema: SchemaJson): Schema {
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
      if (schema.type === 'object') {
        if ('additionalProperties' in schema) {
          return this.createMapSchema(schema);
        }
        return this.createObjectSchema(schema);
      }
    }
    if ('oneOf' in schema) return this.createUnionSchema(schema);
    if ('enum' in schema) return this.createEnumSchema(schema);
    if ('const' in schema) return this.createConstSchema(schema);

    throw new Error('Unsupported schema type');
  }

  private static createArraySchema<const S extends ArraySchemaJson>(
    schema: S
  ): InferArraySchema<S> {
    const itemSchema = this.createSchema(schema.items);
    const arraySchema = new ArraySchema(itemSchema);
    if (schema.maxItems) arraySchema.setMaxItems(schema.maxItems);
    if (schema.minItems) arraySchema.setMinItems(schema.minItems);
    return arraySchema;
  }

  private static createBooleanSchema(): BooleanSchema {
    return new BooleanSchema();
  }

  private static createStringSchema(schema: StringSchemaJson): StringSchema {
    const stringSchema = new StringSchema();
    if (schema.minLength) stringSchema.setMinLength(schema.minLength);
    if (schema.maxLength) stringSchema.setMaxLength(schema.maxLength);
    if (schema.pattern) stringSchema.setPattern(new RegExp(schema.pattern));
    return stringSchema;
  }

  private static createConstSchema<const S extends ConstSchemaJson>(
    schema: S
  ): InferConstSchema<S> {
    return new ConstSchema(schema.const);
  }

  private static createEnumSchema<const S extends EnumSchemaJson>(schema: S): InferEnumSchema<S> {
    return new EnumSchema(schema.enum);
  }

  private static createIntegerSchema(schema: IntegerSchemaJson): NumberSchema {
    const integerSchema = new IntegerSchema();
    if (schema.minimum !== undefined)
      integerSchema.setMinimum(schema.minimum, schema.exclusiveMinimum);
    if (schema.maximum !== undefined)
      integerSchema.setMaximum(schema.maximum, schema.exclusiveMaximum);
    if (schema.multipleOf !== undefined) integerSchema.setMultipleOf(schema.multipleOf);
    return integerSchema;
  }

  private static createMapSchema(schema: MapSchemaJson) {
    const valueSchema = this.createSchema(schema.additionalProperties);
    const mapSchema = new MapSchema(valueSchema);
    if (schema.minProperties) mapSchema.setMinProperties(schema.minProperties);
    if (schema.maxProperties) mapSchema.setMaxProperties(schema.maxProperties);
    if (schema.propertyNames)
      mapSchema.setPropertyNames(this.createStringSchema(schema.propertyNames));
    if (schema.patternProperties) {
      const patternProperties: Record<string, Schema> = {};
      for (const patternProperty in schema.patternProperties) {
        patternProperties[patternProperty] = this.createSchema(
          schema.patternProperties[patternProperty]
        );
      }
      mapSchema.setPatternProperties(patternProperties);
    }
    return mapSchema;
  }

  private static createNullSchema(): NullSchema {
    return new NullSchema();
  }

  private static createNumberSchema(schema: NumberSchemaJson): NumberSchema {
    const numberSchema = new NumberSchema();
    if (schema.minimum !== undefined)
      numberSchema.setMinimum(schema.minimum, schema.exclusiveMinimum);
    if (schema.maximum !== undefined)
      numberSchema.setMaximum(schema.maximum, schema.exclusiveMaximum);
    if (schema.multipleOf !== undefined) numberSchema.setMultipleOf(schema.multipleOf);
    return numberSchema;
  }

  private static createObjectSchema(schema: ObjectSchemaJson) {
    const properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, propSchema]) => {
        return [key, this.createSchema(propSchema)];
      })
    );
    return new ObjectSchema(properties, schema.required);
  }

  private static createSetSchema<const S extends SetSchemaJson>(schema: S): InferSetSchema<S> {
    const itemSchema = this.createSchema(schema.items);
    const setSchema = new SetSchema(itemSchema);
    if (schema.maxItems) setSchema.setMaxItems(schema.maxItems);
    if (schema.minItems) setSchema.setMinItems(schema.minItems);
    return setSchema;
  }

  private static createTupleSchema(schema: TupleSchemaJson) {
    const itemSchemas = schema.prefixItems.map((itemSchema) => this.createSchema(itemSchema));
    return new TupleSchema(itemSchemas);
  }

  private static createUnionSchema(schema: UnionSchemaJson) {
    const optionSchemas = schema.oneOf.map((optionSchema) => this.createObjectSchema(optionSchema));
    return new UnionSchema(optionSchemas);
  }
}
