import { ValueMetadataDefinition } from "../definitions/ValueMetadataDefinition.js";
import type { IRuntimeType } from "./types/IRuntimeType.js";

/** Whole-value design:paramtypes definition; compiler ingestion freezes dense function/undefined arrays.
 * Typed writes retain identity; emitted values cannot restore erased types or dependency identity.
 */
export const DESIGN_PARAMETER_TYPES_METADATA = new ValueMetadataDefinition<readonly IRuntimeType[]>(
  "design:paramtypes",
);
