/** Inherited lookup is the default; own selects direct class declarations. */
export interface IMetadataLookup {
  readonly inheritance?: "inherited" | "own";
}
