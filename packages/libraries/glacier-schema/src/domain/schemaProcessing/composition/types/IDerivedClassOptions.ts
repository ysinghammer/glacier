/** Options shared by the mapped type helpers. */
export interface IDerivedClassOptions {
  /** Name of the derived class, used wherever the schema is named; defaults to the helper name plus the source name. */
  readonly name?: string;
}
