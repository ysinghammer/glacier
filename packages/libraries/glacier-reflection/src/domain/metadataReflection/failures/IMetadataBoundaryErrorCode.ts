/** Safe categories: compiler key/value, decorator target/location, foreign handler, unavailable Reflect, or install failure. */
export type IMetadataBoundaryErrorCode =
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location"
  | "foreign-handler"
  | "reflect-unavailable"
  | "installation-failed";
