import { AppError } from './AppError.js';

/**
 * Thrown when a `Schema` is constructed from a definition that uses an
 * unsupported keyword or an unsupported keyword combination (e.g. `type`
 * together with `oneOf`, or `properties` together with a schema-valued
 * `additionalProperties`).
 *
 * The TypeScript type of a schema literal already rejects these shapes at
 * compile time; this error exists purely as defense-in-depth for callers
 * who bypass the type system (`as any`, untyped external data, etc.).
 */
export class UnsupportedSchemaError extends AppError {
  /**
   * @param message Description of which keyword/combination is unsupported.
   */
  public constructor(message: string) {
    super(message, 'schema-unsupported-keyword');
  }
}
