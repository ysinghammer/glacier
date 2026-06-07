import { SchemaJson } from '../../src';

/**
 * Returns a deeply nested SchemaJson using all supported schema types and options.
 * This schema is designed to exercise every feature for comprehensive testing.
 * @returns {SchemaJson} A complex schema definition.
 */
export function fakeJsonSchema(): SchemaJson {
  return {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
        multipleOf: 1
      },
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[A-Za-z ]+$'
      },
      isActive: {
        type: 'boolean'
      },
      role: {
        enum: ['admin', 'user', 'guest']
      },
      status: {
        const: 'active'
      },
      meta: {
        type: 'object',
        properties: {
          created: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$'
          },
          updated: {
            type: 'null'
          }
        },
        required: ['created', 'updated']
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 2
        },
        minItems: 1,
        maxItems: 5
      },
      scores: {
        type: 'array',
        items: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          multipleOf: 0.5
        },
        minItems: 3,
        maxItems: 3
      },
      preferences: {
        type: 'object',
        properties: {},
        required: []
      },
      settings: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: {
          type: 'boolean'
        },
        minProperties: 1,
        maxProperties: 3,
        propertyNames: {
          type: 'string',
          pattern: '^[a-z]+$'
        },
        patternProperties: {
          '^debug_': {
            type: 'boolean'
          }
        }
      },
      unionExample: {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: {
                const: 'A'
              },
              value: {
                type: 'string'
              }
            },
            required: ['type', 'value']
          },
          {
            type: 'object',
            properties: {
              type: {
                const: 'B'
              },
              value: {
                type: 'integer',
                minimum: 0
              }
            },
            required: ['type', 'value']
          }
        ]
      },
      tupleExample: {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'integer' }, { type: 'boolean' }],
        items: false
      },
      setExample: {
        type: 'array',
        items: {
          type: 'integer',
          minimum: 1
        },
        uniqueItems: true,
        minItems: 1,
        maxItems: 3
      },
      // Minimal object (no optional options)
      minimalObject: {
        type: 'object',
        properties: {},
        required: []
      },
      // Minimal array
      minimalArray: {
        type: 'array',
        items: { type: 'string' }
      },
      // Minimal string
      minimalString: {
        type: 'string'
      },
      // Minimal number
      minimalNumber: {
        type: 'number'
      },
      // Minimal integer
      minimalInteger: {
        type: 'integer'
      },
      // Minimal boolean
      minimalBoolean: {
        type: 'boolean'
      },
      // Minimal null
      minimalNull: {
        type: 'null'
      },
      // Minimal enum
      minimalEnum: {
        enum: ['A', 'B']
      },
      // Minimal const
      minimalConst: {
        const: 1
      },
      // Minimal set
      minimalSet: {
        type: 'array',
        items: { type: 'integer' },
        uniqueItems: true
      },
      // Minimal tuple
      minimalTuple: {
        type: 'array',
        prefixItems: [{ type: 'string' }],
        items: false
      },
      // Minimal union
      minimalUnion: {
        oneOf: [
          {
            type: 'object',
            properties: {},
            required: []
          },
          {
            type: 'object',
            properties: { foo: { type: 'string' } },
            required: ['foo']
          }
        ]
      },
      // Minimal map
      minimalMap: {
        type: 'object',
        additionalProperties: { type: 'string' }
      }
    },
    required: [
      'id',
      'name',
      'isActive',
      'role',
      'status',
      'meta',
      'tags',
      'scores',
      'preferences',
      'settings',
      'unionExample',
      'tupleExample',
      'setExample',
      'minimalObject',
      'minimalArray',
      'minimalString',
      'minimalNumber',
      'minimalInteger',
      'minimalBoolean',
      'minimalNull',
      'minimalEnum',
      'minimalConst',
      'minimalSet',
      'minimalTuple',
      'minimalUnion',
      'minimalMap'
    ]
  };
}
