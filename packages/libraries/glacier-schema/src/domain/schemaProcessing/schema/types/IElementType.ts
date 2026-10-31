import type { IClass } from "@glacier/reflection";

/**
 * Element type accepted by collection and object decorators: a primitive constructor, decorated class or
 * arrow-function class reference for forward references and cycles.
 */
export type IElementType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | BigIntConstructor
  | DateConstructor
  | IClass
  | (() => IClass);
