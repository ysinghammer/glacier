import type { IMetadataKind } from "./IMetadataKind.js";
/** Discovery identity is descriptive, not an untyped write or read capability. */
export interface IMetadataDefinitionIdentity {
  readonly name: string;
  readonly kind: IMetadataKind;
}
