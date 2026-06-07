import { SchemaJson } from './SchemaJson';
import { BooleanSchemaJson } from './schemas/BooleanSchemaJson';
import { StringSchemaJson } from './schemas/StringSchemaJson';
import { NullSchemaJson } from './schemas/NullSchemaJson';
import { IntegerSchemaJson } from './schemas/IntegerSchemaJson';
import { NumberSchemaJson } from './schemas/NumberSchemaJson';
import { EnumSchemaJson } from './schemas/EnumSchemaJson';
import { ConstSchemaJson } from './schemas/ConstSchemaJson';
import { ArraySchemaJson } from './schemas/ArraySchemaJson';
import { SetSchemaJson } from './schemas/SetSchemaJson';
import { TupleSchemaJson } from './schemas/TupleSchemaJson';
import { ObjectSchemaJson } from './schemas/ObjectSchemaJson';
import { MapSchemaJson } from './schemas/MapSchemaJson';
import { UnionSchemaJson } from './schemas/UnionSchemaJson';
import { InferBooleanSchema } from './inferSchemas/InferBooleanSchema';
import { InferStringSchema } from './inferSchemas/InferStringSchema';
import { InferNullSchema } from './inferSchemas/InferNullSchema';
import { InferIntegerSchema } from './inferSchemas/InferIntegerSchema';
import { InferNumberSchema } from './inferSchemas/InferNumberSchema';
import { InferEnumSchema } from './inferSchemas/InferEnumSchema';
import { InferConstSchema } from './inferSchemas/InferConstSchema';
import { InferArraySchema } from './inferSchemas/InferArraySchema';
import { InferSetSchema } from './inferSchemas/InferSetSchema';
import { InferTupleSchema } from './inferSchemas/InferTupleSchema';
import { InferObjectSchema } from './inferSchemas/InferObjectSchema';
import { InferMapSchema } from './inferSchemas/InferMapSchema';
import { InferUnionSchema } from './inferSchemas/InferUnionSchema';

export type InferSchema<S extends SchemaJson> = S extends BooleanSchemaJson
  ? InferBooleanSchema
  : S extends StringSchemaJson
    ? InferStringSchema
    : S extends NullSchemaJson
      ? InferNullSchema
      : S extends IntegerSchemaJson
        ? InferIntegerSchema
        : S extends NumberSchemaJson
          ? InferNumberSchema
          : S extends EnumSchemaJson
            ? InferEnumSchema<S>
            : S extends ConstSchemaJson
              ? InferConstSchema<S>
              : S extends ArraySchemaJson
                ? InferArraySchema<S>
                : S extends SetSchemaJson
                  ? InferSetSchema<S>
                  : S extends TupleSchemaJson
                    ? InferTupleSchema<S>
                    : S extends ObjectSchemaJson
                      ? InferObjectSchema<S>
                      : S extends MapSchemaJson
                        ? InferMapSchema<S>
                        : S extends UnionSchemaJson
                          ? InferUnionSchema<S>
                          : never;
