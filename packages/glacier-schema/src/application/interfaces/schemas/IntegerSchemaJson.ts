/**
 * JSON Schema `integer` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/numeric.html#integer
 */
export interface IntegerSchemaJson {
  /**
   * Declares the instance must be an integer number.
   */
  type: 'integer';
  /**
   * Multiple-of constraint.
   * JSON Schema `multipleOf`.
   */
  multipleOf?: number;
  /**
   * Maximum value (`<=`).
   * JSON Schema `maximum`.
   */
  maximum?: number;
  /**
   * Exclusive maximum (`<`).
   * JSON Schema `exclusiveMaximum`.
   */
  exclusiveMaximum?: boolean;
  /**
   * Minimum value (`>=`).
   * JSON Schema `minimum`.
   */
  minimum?: number;
  /**
   * Exclusive minimum (`>`).
   * JSON Schema `exclusiveMinimum`.
   */
  exclusiveMinimum?: boolean;
}
