import type { Schema } from '../schema/Schema.js';
import type { IArraySchemaNode } from './_interfaces/IArraySchemaNode.js';
import type { IBooleanSchemaNode } from './_interfaces/IBooleanSchemaNode.js';
import type { IClosedObjectSchemaNode } from './_interfaces/IClosedObjectSchemaNode.js';
import type { INumberSchemaNode } from './_interfaces/INumberSchemaNode.js';
import type { IOneOfSchemaNode } from './_interfaces/IOneOfSchemaNode.js';
import type { IOpenObjectSchemaNode } from './_interfaces/IOpenObjectSchemaNode.js';
import type { IStringSchemaNode } from './_interfaces/IStringSchemaNode.js';
import type { TObjectSchemaNode } from './TObjectSchemaNode.js';
import type { TSchemaLike } from './TSchemaLike.js';

/** Recursive schema-literal -> TypeScript type mapping. Distributes over unions of nodes. */
export type InferNode<N> =
  N extends Schema<infer _D, infer T>
    ? T
    : N extends IOneOfSchemaNode
      ? InferNode<N['oneOf'][number]>
      : N extends IStringSchemaNode
        ? InferStringLiteral<N>
        : N extends INumberSchemaNode
          ? InferNumberLiteral<N>
          : N extends IBooleanSchemaNode
            ? InferBooleanLiteral<N>
            : N extends IArraySchemaNode
              ? InferArray<N>
              : N extends TObjectSchemaNode
                ? InferObject<N>
                : never;

type InferStringLiteral<N extends IStringSchemaNode> = N extends { readonly const: infer C }
  ? C
  : N extends { readonly enum: infer E extends readonly string[] }
    ? E[number]
    : string;

type InferNumberLiteral<N extends INumberSchemaNode> = N extends { readonly const: infer C }
  ? C
  : N extends { readonly enum: infer E extends readonly number[] }
    ? E[number]
    : number;

type InferBooleanLiteral<N extends IBooleanSchemaNode> = N extends { readonly const: infer C }
  ? C
  : N extends { readonly enum: infer E extends readonly boolean[] }
    ? E[number]
    : boolean;

type RequiredKeysOf<N> = N extends { readonly required: infer R extends readonly string[] }
  ? R[number]
  : never;

/** Flattens an intersection type into a single object type for readable hovers. */
type Prettify<T> = { [K in keyof T]: T[K] };

type InferClosedObject<N extends IClosedObjectSchemaNode> = Prettify<
  {
    [K in Extract<keyof N['properties'], RequiredKeysOf<N>>]: InferNode<N['properties'][K]>;
  } & {
    [K in Exclude<keyof N['properties'], RequiredKeysOf<N>>]?: InferNode<N['properties'][K]>;
  }
>;

type InferOpenObject<N extends IOpenObjectSchemaNode> = N extends {
  readonly additionalProperties: infer AP;
}
  ? AP extends true
    ? Record<string, unknown>
    : AP extends TSchemaLike
      ? Record<string, InferNode<AP>>
      : Record<string, never>
  : Record<string, never>;

type InferObject<N extends TObjectSchemaNode> = N extends IClosedObjectSchemaNode
  ? InferClosedObject<N>
  : N extends IOpenObjectSchemaNode
    ? InferOpenObject<N>
    : never;

type InferTuple<T extends readonly TSchemaLike[]> = T extends readonly [infer Head, ...infer Rest]
  ? Rest extends readonly TSchemaLike[]
    ? [Head extends TSchemaLike ? InferNode<Head> : never, ...InferTuple<Rest>]
    : [Head extends TSchemaLike ? InferNode<Head> : never]
  : [];

type InferArray<N extends IArraySchemaNode> = N extends {
  readonly prefixItems: infer PI extends readonly TSchemaLike[];
}
  ? N extends { readonly items: infer IT extends TSchemaLike }
    ? [...InferTuple<PI>, ...InferNode<IT>[]]
    : InferTuple<PI>
  : N extends { readonly items: infer IT extends TSchemaLike }
    ? InferNode<IT>[]
    : unknown[];
