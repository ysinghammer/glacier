import { ValueMetadataDefinition } from "./ValueMetadataDefinition.js";
import type { IRuntimeType } from "./IRuntimeType.js";

/**
 * Ordinary nearest whole-value definition for design:returntype compiler representations.
 * Compiler ingestion accepts functions/undefined; explicit typed annotations use ordinary value semantics.
 * These representations do not reconstruct generic return arguments or erased interfaces.
 */
export const DESIGN_RETURN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>(
  "design:returntype",
);
