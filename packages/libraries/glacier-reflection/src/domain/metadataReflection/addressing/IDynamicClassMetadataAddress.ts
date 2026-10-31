import type { IDynamicInstanceMetadataAddress } from "./IDynamicInstanceMetadataAddress.js";
/** Complete erased surface; actual target restrictions are validated at runtime. */
export type IDynamicClassMetadataAddress =
  | IDynamicInstanceMetadataAddress
  | { readonly kind: "member"; readonly side: "static"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side: "static";
      readonly member: PropertyKey;
      readonly position: number;
    }
  | { readonly kind: "constructor-parameter"; readonly position: number };
