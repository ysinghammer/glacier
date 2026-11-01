/** Compiler boundary rejection variants for unsupported keys, malformed values, or invalid targets/locations. */
export type ICompilerMetadataRejectionCode =
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location";
