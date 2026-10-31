/** Definition-time programming failure for invalid schema declarations, distinct from invalid input errors. */
export class SchemaDefinitionError extends Error {
  /**
   * Constructs a definition error with the supplied diagnostic.
   * @param message Explanation of the invalid declaration or unsupported operation.
   */
  public constructor(message: string) {
    super(message);
    this.name = "SchemaDefinitionError";
  }
}
