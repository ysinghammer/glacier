import { JsonPrimitive } from '../../../shared/types/JsonPrimitive';

/**
 * JSON Schema `enum` keyword definition.
 * References: https://json-schema.org/understanding-json-schema/reference/generic.html#enumerated-values
 */
export interface EnumSchemaJson {
  /**
   * A non-empty array of allowed values.
   */
  enum: JsonPrimitive[];
}
