import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IModuleOptions } from "../modules/IModuleOptions.js";

/** Class-level declaration written by `@Module`; own lookup only, never inherited. */
export const MODULE_OPTIONS_METADATA = new ValueMetadataDefinition<IModuleOptions>(
  "glacier-ioc:module-options",
);
