import type { IDynamicClassMetadataAddress } from "./IDynamicClassMetadataAddress.js";
/** Canonical member keys normalize numeric names to strings. */
type ICanonicalMetadataAddress<T> = T extends { readonly member: PropertyKey }
  ? Omit<T, "member"> & { readonly member: string | symbol }
  : T;
/** Target-free readonly discovery output consumed by dynamic read-side methods. */
export type IDiscoveredMetadataAddress = ICanonicalMetadataAddress<IDynamicClassMetadataAddress>;
