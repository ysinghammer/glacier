import type { IMetadataClassAddress } from "./IMetadataClassAddress.js";
/** Erased instance locations make no finite-key or tuple-bound guarantee. */
export type IDynamicInstanceMetadataAddress =
  | IMetadataClassAddress
  | { readonly kind: "member"; readonly side?: "instance"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side?: "instance";
      readonly member: PropertyKey;
      readonly position: number;
    };
