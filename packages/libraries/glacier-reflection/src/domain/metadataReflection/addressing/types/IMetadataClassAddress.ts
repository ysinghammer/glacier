/** Explicit address for metadata attached to the class itself, equivalent to omission. */
export interface IMetadataClassAddress {
  /** Readonly discriminator identifying class-level metadata. */
  readonly kind: "class";
}
