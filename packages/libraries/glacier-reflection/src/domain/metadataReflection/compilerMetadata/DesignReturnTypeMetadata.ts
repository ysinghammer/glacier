import { ValueMetadataDefinition } from "../definitions/ValueMetadataDefinition.js";
import type { IRuntimeType } from "./types/IRuntimeType.js";

/** Whole-value design:returntype definition; compiler ingestion accepts function/undefined representations.
 * Typed annotations do not recover generic arguments or erased interfaces.
 */
export const DESIGN_RETURN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>(
  "design:returntype",
);
