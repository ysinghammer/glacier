/** Observable decorator and compiler integration failure categories. */
export type IMetadataBoundaryErrorCode =
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location"
  | "foreign-handler"
  | "reflect-unavailable"
  | "installation-failed";
