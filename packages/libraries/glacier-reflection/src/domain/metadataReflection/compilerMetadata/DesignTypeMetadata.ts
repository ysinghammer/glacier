import { ValueMetadataDefinition } from "../definitions/ValueMetadataDefinition.js";
import type { IRuntimeType } from "./types/IRuntimeType.js";

/** Whole-value design:type; compiler ingestion checks function/undefined representations.
 * Typed annotations retain identity; Object/Function emissions do not prove source types or constructability.
 */
export const DESIGN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>("design:type");
