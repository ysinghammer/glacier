/** Expected compiler-boundary rejection categories, distinct from direct-operation outcomes. */
export type ICompilerMetadataRejectionCode =
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location";
