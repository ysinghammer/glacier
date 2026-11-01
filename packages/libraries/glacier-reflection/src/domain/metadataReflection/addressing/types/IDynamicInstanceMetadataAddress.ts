import type { IMetadataClassAddress } from "./IMetadataClassAddress.js";
/** Erased instance-side locations without finite-key or tuple-bound guarantees.
 * @property kind Readonly class, member, or method-parameter discriminator.
 * @property side Readonly optional instance side; omitted means `instance`.
 * @property member Readonly dynamic string, symbol, or numeric member key.
 * @property position Readonly numeric method parameter position validated at runtime.
 * @default side=instance.
 */
export type IDynamicInstanceMetadataAddress =
  | IMetadataClassAddress
  | { readonly kind: "member"; readonly side?: "instance"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side?: "instance";
      readonly member: PropertyKey;
      readonly position: number;
    };
