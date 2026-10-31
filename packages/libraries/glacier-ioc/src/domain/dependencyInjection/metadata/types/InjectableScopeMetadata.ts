import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IProviderScope } from "./IProviderScope.js";

/** Class-level declaration written by `@Injectable`; own lookup only, never inherited. */
export const INJECTABLE_SCOPE_METADATA = new ValueMetadataDefinition<IProviderScope>(
  "glacier-ioc:injectable-scope",
);
