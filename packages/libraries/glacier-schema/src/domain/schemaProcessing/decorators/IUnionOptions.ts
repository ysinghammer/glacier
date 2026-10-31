import type { IUnionVariants } from "../schema/IUnionVariants.js";

/** Explicit mapping of a discriminated union. */
export interface IUnionOptions {
  /** Name of the input property whose string value selects the variant. */
  readonly discriminator: string;
  /** Variant class for each discriminator value; at least one is required. */
  readonly variants: IUnionVariants;
}
