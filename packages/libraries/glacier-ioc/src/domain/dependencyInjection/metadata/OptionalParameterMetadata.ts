import { ValueMetadataDefinition } from "@glacier/reflection";

/** Constructor-parameter flag written by `@Optional`; own lookup only. */
export const OPTIONAL_PARAMETER_METADATA = new ValueMetadataDefinition<boolean>(
  "glacier-ioc:optional-parameter",
);
