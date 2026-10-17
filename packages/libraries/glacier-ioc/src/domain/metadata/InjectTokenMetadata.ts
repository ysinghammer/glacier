import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IToken } from "../tokens/IToken.js";

/** Constructor-parameter declaration written by `@Inject`; own lookup only. */
export const INJECT_TOKEN_METADATA = new ValueMetadataDefinition<IToken>(
  "glacier-ioc:inject-token",
);
