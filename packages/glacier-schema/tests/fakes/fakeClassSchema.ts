/**
 * Returns a decorated class that matches the structure of fakeJsonSchema.
 * All properties are decorated with the @Schema decorator using the corresponding schema definition.
 * This class can be used to test class-based schema reflection and validation.
 */
import { Schema } from '../../src';

export class MetaSchema {
  @Schema({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  created!: string;

  @Schema({ type: 'null' })
  updated!: null;
}

export class UnionA {
  @Schema({ const: 'A' })
  type!: 'A';
  @Schema({ type: 'string' })
  value!: string;
}

export class UnionB {
  @Schema({ const: 'B' })
  type!: 'B';
  @Schema({ type: 'integer', minimum: 0 })
  value!: number;
}

export class MinimalUnionFoo {
  @Schema({ type: 'string' })
  foo!: string;
}

export class EmptyObject {}

export class FakeClassSchema {
  @Schema({ type: 'integer', minimum: 1, maximum: 1000, multipleOf: 1 })
  id!: number;

  @Schema({ type: 'string', minLength: 3, maxLength: 50, pattern: '^[A-Za-z ]+$' })
  name!: string;

  @Schema({ type: 'boolean' })
  isActive!: boolean;

  @Schema({ enum: ['admin', 'user', 'guest'] })
  role!: 'admin' | 'user' | 'guest';

  @Schema({ const: 'active' })
  status!: 'active';

  @Schema({ type: MetaSchema })
  meta!: MetaSchema;

  @Schema({ type: 'array', items: { type: 'string', minLength: 2 }, minItems: 1, maxItems: 5 })
  tags!: string[];

  @Schema({
    type: 'array',
    items: { type: 'number', minimum: 0, maximum: 100, multipleOf: 0.5 },
    minItems: 3,
    maxItems: 3
  })
  scores!: number[];

  @Schema({ type: EmptyObject })
  preferences!: EmptyObject;

  @Schema({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    minProperties: 1,
    maxProperties: 3,
    propertyNames: { type: 'string', pattern: '^[a-z]+$' },
    patternProperties: { '^debug_': { type: 'boolean' } }
  })
  settings!: Record<string, boolean>;

  @Schema({
    oneOf: [
      {
        type: UnionA
      },
      {
        type: UnionB
      }
    ]
  })
  unionExample!: UnionA | UnionB;

  @Schema({
    type: 'array',
    prefixItems: [{ type: 'string' }, { type: 'integer' }, { type: 'boolean' }],
    items: false
  })
  tupleExample!: [string, number, boolean];

  @Schema({
    type: 'array',
    items: { type: 'integer', minimum: 1 },
    uniqueItems: true,
    minItems: 1,
    maxItems: 3
  })
  setExample!: number[];

  // Minimal object (no optional options)
  @Schema({ type: 'object', additionalProperties: { type: 'null' } })
  minimalObject!: Record<string, null>;

  // Minimal array
  @Schema({ type: 'array', items: { type: 'string' } })
  minimalArray!: string[];

  // Minimal string
  @Schema({ type: 'string' })
  minimalString!: string;

  // Minimal number
  @Schema({ type: 'number' })
  minimalNumber!: number;

  // Minimal integer
  @Schema({ type: 'integer' })
  minimalInteger!: number;

  // Minimal boolean
  @Schema({ type: 'boolean' })
  minimalBoolean!: boolean;

  // Minimal null
  @Schema({ type: 'null' })
  minimalNull!: null;

  // Minimal enum
  @Schema({ enum: ['A', 'B'] })
  minimalEnum!: 'A' | 'B';

  // Minimal const
  @Schema({ const: 1 })
  minimalConst!: 1;

  // Minimal set
  @Schema({ type: 'array', items: { type: 'integer' }, uniqueItems: true })
  minimalSet!: number[];

  // Minimal tuple
  @Schema({ type: 'array', prefixItems: [{ type: 'string' }], items: false })
  minimalTuple!: [string];

  // Minimal union
  @Schema({
    oneOf: [{ type: EmptyObject }, { type: MinimalUnionFoo }]
  })
  minimalUnion!: EmptyObject | MinimalUnionFoo;

  // Minimal map
  @Schema({ type: 'object', additionalProperties: { type: 'string' } })
  minimalMap!: Record<string, string>;

  // Minimal map
  @Schema({ type: 'string', optional: true })
  optionalParam!: string;
}
