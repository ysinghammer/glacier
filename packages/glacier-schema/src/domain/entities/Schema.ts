/**
 * Abstract base class for all Schema types.
 *
 * This class models the validation and type assertion behavior similar to JSON Schema (https://json-schema.org/)
 * where a schema can validate input and narrow types.
 *
 * Responsibilities:
 * - Provide a common interface for `validate`, `assertValid`, and `isValid` across all schema implementations.
 * - Encapsulate the pattern of throwing on invalid values and returning the typed output on success.
 *
 * Notes:
 * - `validate` must be implemented by concrete schema classes to perform the actual checks according to the
 *   respective JSON Schema keyword semantics.
 * - `assertValid` delegates to `validate` and narrows the TypeScript type if validation succeeds.
 * - `isValid` returns a boolean instead of throwing and is useful for quick checks.
 */
export abstract class Schema<O = unknown> {
  /**
   * Validates a value against the schema and returns the typed output on success.
   *
   * This mirrors the idea of a JSON Schema instance validation where the instance (value) is checked against
   * the schema rules. On failure, implementations should throw an error describing the violation.
   *
   * @param value - The value to validate.
   * @throws ValidationError if validation fails.
   * @returns The validated value typed as `O`.
   */
  public abstract validate(value: unknown): O;

  /**
   * Checks if a value is valid according to the schema.
   *
   * This is a convenience wrapper around `validate` that returns a boolean instead of throwing. It maps to the
   * idea of checking whether a value conforms to the JSON Schema rules at runtime.
   *
   * @param value - The value to validate.
   * @returns True if valid, false otherwise.
   */
  public isValid(value: unknown): value is O {
    try {
      this.validate(value);
      return true;
    } catch {
      return false;
    }
  }
}
