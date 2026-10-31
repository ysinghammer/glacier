/** Optional mode selecting direct declarations or declarations along the class ancestry. */
export interface IMetadataLookup {
  /** Readonly lookup mode; `own` excludes ancestors.
   * @default inherited
   */
  readonly inheritance?: "inherited" | "own";
}
