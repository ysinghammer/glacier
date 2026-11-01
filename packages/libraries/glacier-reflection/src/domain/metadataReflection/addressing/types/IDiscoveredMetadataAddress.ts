import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
/** Canonicalizes dynamic addresses by converting numeric member keys to strings.
 * @template T Dynamic address variant to canonicalize.
 */
type ICanonicalMetadataAddress<T> = T extends { readonly member: PropertyKey }
  ? Omit<T, "member"> & { readonly member: string | symbol }
  : T;
/** Target-free readonly address snapshot; numeric member keys are canonicalized to strings. */
export type IDiscoveredMetadataAddress = ICanonicalMetadataAddress<IDynamicClassMetadataAddress>;
