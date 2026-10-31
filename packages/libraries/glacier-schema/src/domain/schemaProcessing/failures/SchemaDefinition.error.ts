/**
 * Thrown when a class is declared incorrectly: late decoration after the first parse, conflicting or
 * duplicated type decorators, invalid decorator arguments or unsupported targets. It is a programming
 * error, distinct from `SchemaError`, which reports invalid input.
 */
export class SchemaDefinitionError extends Error {
  /** Creates the error with a message naming the offending class member. */
  public constructor(message: string) {
    super(message);
    this.name = "SchemaDefinitionError";
  }
}
