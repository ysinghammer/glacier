import type { IMetadataKind } from "./IMetadataKind.js";
/** Readonly identity metadata returned by discovery, not an untyped read/write capability. */
export interface IMetadataDefinitionIdentity {
  /** Descriptive name supplied when the definition instance was created. */
  readonly name: string;
  /** Fixed value, list, or record resolution behavior of the definition. */
  readonly kind: IMetadataKind;
}
