import type { IClass } from "@glacier/reflection";

/**
 * Element type argument of the collection and object decorators: a primitive constructor (`String`,
 * `Number`, `Boolean`, `BigInt`, `Date`), a decorated class, or an arrow function returning a class for
 * forward references and cycles.
 */
export type IElementType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | BigIntConstructor
  | DateConstructor
  | IClass
  | (() => IClass);
