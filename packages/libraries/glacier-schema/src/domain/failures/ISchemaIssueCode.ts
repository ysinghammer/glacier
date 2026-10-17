/** Stable machine-readable issue codes; messages may be overridden but codes never change. */
export type ISchemaIssueCode =
  | "invalid_type"
  | "invalid_literal"
  | "invalid_enum_value"
  | "invalid_date"
  | "too_small"
  | "too_big"
  | "invalid_format"
  | "not_multiple_of"
  | "not_unique"
  | "invalid_union"
  | "invalid_discriminator"
  | "max_depth_exceeded"
  | "transform_failed"
  | "custom";
