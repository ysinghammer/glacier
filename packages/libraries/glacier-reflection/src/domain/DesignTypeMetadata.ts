import { ValueMetadataDefinition } from "./ValueMetadataDefinition.js";
import type { IRuntimeType } from "./IRuntimeType.js";

/**
 * Ordinary whole-value definition for design:type compiler member representations.
 * Functions/undefined are checked only at compiler ingestion; ordinary typed annotations retain identity.
 * Emitted Object/Function values do not reconstruct erased source types or prove constructability.
 */
export const DESIGN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>("design:type");
