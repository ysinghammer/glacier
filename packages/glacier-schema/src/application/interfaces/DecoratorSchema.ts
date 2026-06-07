import { ArrayDecorator } from './decoratorSchema/ArrayDecorator';
import { BooleanDecorator } from './decoratorSchema/BooleanDecorator';
import { ConstDecorator } from './decoratorSchema/ConstDecorator';
import { EnumDecorator } from './decoratorSchema/EnumDecorator';
import { IntegerDecorator } from './decoratorSchema/IntegerDecorator';
import { MapDecorator } from './decoratorSchema/MapDecorator';
import { NullDecorator } from './decoratorSchema/NullDecorator';
import { NumberDecorator } from './decoratorSchema/NumberDecorator';
import { SetDecorator } from './decoratorSchema/SetDecorator';
import { StringDecorator } from './decoratorSchema/StringDecorator';
import { TupleDecorator } from './decoratorSchema/TupleDecorator';
import { UnionDecorator } from './decoratorSchema/UnionDecorator';
import { ObjectDecorator } from './decoratorSchema/ObjectDecorator';

/**
 * Discriminated union of supported JSON Schema shapes used by this application.
 * Each interface maps to a subset of the official JSON Schema keywords.
 * References: https://json-schema.org/understanding-json-schema/
 */
export type DecoratorSchema =
  | ArrayDecorator
  | BooleanDecorator
  | ConstDecorator
  | EnumDecorator
  | IntegerDecorator
  | MapDecorator
  | NullDecorator
  | NumberDecorator
  | ObjectDecorator
  | SetDecorator
  | StringDecorator
  | TupleDecorator
  | UnionDecorator;
