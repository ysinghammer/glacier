import type { IDynamicInstanceMetadataAddress } from "./IDynamicInstanceMetadataAddress.js";
/** Erased constructor-side address variants; key and position limits are checked at runtime.
 * @property kind Readonly class, member, method, or constructor-parameter discriminator.
 * @property side Readonly required static side for static members and methods.
 * @property member Readonly string, symbol, or numeric dynamic member key.
 * @property position Readonly safe nonnegative integer parameter position.
 */
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
