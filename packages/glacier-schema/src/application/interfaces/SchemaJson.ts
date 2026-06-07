import { BooleanSchemaJson } from './schemas/BooleanSchemaJson';
import { ConstSchemaJson } from './schemas/ConstSchemaJson';
import { EnumSchemaJson } from './schemas/EnumSchemaJson';
import { IntegerSchemaJson } from './schemas/IntegerSchemaJson';
import { NullSchemaJson } from './schemas/NullSchemaJson';
import { NumberSchemaJson } from './schemas/NumberSchemaJson';
import { ObjectSchemaJson } from './schemas/ObjectSchemaJson';
import { MapSchemaJson } from './schemas/MapSchemaJson';
import { ArraySchemaJson } from './schemas/ArraySchemaJson';
import { TupleSchemaJson } from './schemas/TupleSchemaJson';
import { SetSchemaJson } from './schemas/SetSchemaJson';
import { UnionSchemaJson } from './schemas/UnionSchemaJson';
import { StringSchemaJson } from './schemas/StringSchemaJson';

/**
 * Discriminated union of supported JSON Schema shapes used by this application.
 * Each interface maps to a subset of the official JSON Schema keywords.
 * References: https://json-schema.org/understanding-json-schema/
 */
export type SchemaJson =
  | ArraySchemaJson
  | BooleanSchemaJson
  | ConstSchemaJson
  | EnumSchemaJson
  | IntegerSchemaJson
  | MapSchemaJson
  | NullSchemaJson
  | NumberSchemaJson
  | ObjectSchemaJson
  | SetSchemaJson
  | StringSchemaJson
  | TupleSchemaJson
  | UnionSchemaJson;
