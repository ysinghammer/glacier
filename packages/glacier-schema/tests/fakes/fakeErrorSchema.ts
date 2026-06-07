import { SchemaJson } from '../../src';

export function fakeErrorSchema(): SchemaJson {
  return {
    type: 'object',
    required: [],
    properties: {
      address: {
        type: 'array',
        items: {
          type: 'object',
          required: [],
          properties: {
            street: {
              type: 'string'
            }
          }
        }
      }
    }
  };
}
