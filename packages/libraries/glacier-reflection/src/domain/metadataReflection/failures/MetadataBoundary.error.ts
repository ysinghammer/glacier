import type { IMetadataBoundaryErrorCode } from "./IMetadataBoundaryErrorCode.js";

/** Reports safe compiler, decorator, or registration boundary failures by category.
 * Foreign handlers are not replaced; installation recovery requires correcting imports and starting a fresh realm.
 */
export class MetadataBoundaryError extends Error {
  /** Readonly safe failure category; contains no consumer values or source. */
  public readonly code: IMetadataBoundaryErrorCode;

  /** Creates an error with a code-derived message and optional cause.
   * @param code Safe boundary failure category used in the message and property.
   * @param options Optional ErrorOptions, including an explicitly supplied cause.
   */
  constructor(code: IMetadataBoundaryErrorCode, options?: ErrorOptions) {
    super(`Metadata boundary rejected: ${code}`, options);
    this.name = "MetadataBoundaryError";
    this.code = code;
  }
}
