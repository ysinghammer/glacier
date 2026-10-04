import type { IMetadataBoundaryErrorCode } from "./IMetadataBoundaryErrorCode.js";

/**
 * Reports decorator/compiler/import rejection with a safe code-derived message, never consumer values/source.
 * Reflect installation failures require correcting the dependency/import arrangement and starting a fresh realm.
 * Foreign handlers remain unchanged; this class provides no reset, uninstall or coexistence mechanism.
 */
export class MetadataBoundaryError extends Error {
  readonly code: IMetadataBoundaryErrorCode;

  /** Retains the safe category and any explicitly supplied exceptional cause. */
  constructor(code: IMetadataBoundaryErrorCode, options?: ErrorOptions) {
    super(`Metadata boundary rejected: ${code}`, options);
    this.name = "MetadataBoundaryError";
    this.code = code;
  }
}
