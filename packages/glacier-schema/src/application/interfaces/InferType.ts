import { SchemaJson } from './SchemaJson';
import { BooleanSchemaJson } from './schemas/BooleanSchemaJson';
import { InferBooleanType } from './inferType/InferBooleanType';
import { StringSchemaJson } from './schemas/StringSchemaJson';
import { InferStringType } from './inferType/InferStringType';
import { NullSchemaJson } from './schemas/NullSchemaJson';
import { InferNullType } from './inferType/InferNullType';
import { IntegerSchemaJson } from './schemas/IntegerSchemaJson';
import { InferIntegerType } from './inferType/InferIntegerType';
import { NumberSchemaJson } from './schemas/NumberSchemaJson';
import { InferNumberType } from './inferType/InferNumberType';
import { EnumSchemaJson } from './schemas/EnumSchemaJson';
import { InferEnumType } from './inferType/InferEnumType';
import { ConstSchemaJson } from './schemas/ConstSchemaJson';
import { InferConstType } from './inferType/InferConstType';
import { ArraySchemaJson } from './schemas/ArraySchemaJson';
import { InferArrayType } from './inferType/InferArrayType';
import { SetSchemaJson } from './schemas/SetSchemaJson';
import { InferSetType } from './inferType/InferSetType';
import { TupleSchemaJson } from './schemas/TupleSchemaJson';
import { InferTupleType } from './inferType/InferTupleType';
import { ObjectSchemaJson } from './schemas/ObjectSchemaJson';
import { InferObjectType } from './inferType/InferObjectType';
import { MapSchemaJson } from './schemas/MapSchemaJson';
import { InferMapType } from './inferType/InferMapType';
import { UnionSchemaJson } from './schemas/UnionSchemaJson';
import { InferUnionType } from './inferType/InferUnionType';

export type InferType<S extends SchemaJson> = S extends BooleanSchemaJson
  ? InferBooleanType
  : S extends StringSchemaJson
    ? InferStringType
    : S extends NullSchemaJson
      ? InferNullType
      : S extends IntegerSchemaJson
        ? InferIntegerType
        : S extends NumberSchemaJson
          ? InferNumberType
          : S extends EnumSchemaJson
            ? InferEnumType<S>
            : S extends ConstSchemaJson
              ? InferConstType<S>
              : S extends ArraySchemaJson
                ? InferArrayType<S>
                : S extends SetSchemaJson
                  ? InferSetType<S>
                  : S extends TupleSchemaJson
                    ? InferTupleType<S>
                    : S extends ObjectSchemaJson
                      ? InferObjectType<S>
                      : S extends MapSchemaJson
                        ? InferMapType<S>
                        : S extends UnionSchemaJson
                          ? InferUnionType<S>
                          : never;
