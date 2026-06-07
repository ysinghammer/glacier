import { BaseDecorator } from './BaseDecorator';

/**
 * JSON Schema `number` type definition.
 * References: https://json-schema.org/understanding-json-schema/reference/numeric.html
 */
export interface NumberDecorator extends BaseDecorator {
  /**
   * Declares the instance must be a number (floating-point allowed).
   */
  type: 'number';
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
