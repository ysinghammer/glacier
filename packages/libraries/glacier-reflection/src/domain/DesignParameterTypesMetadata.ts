import { ValueMetadataDefinition } from "./ValueMetadataDefinition.js";
import type { IRuntimeType } from "./IRuntimeType.js";

/**
 * Ordinary whole-array replacement definition for design:paramtypes, never an accumulating list.
 * Compiler ingestion validates dense function/undefined entries and snapshots/freezes the whole array.
 * Typed set/decorator calls retain supplied array identity. Empty descendant arrays replace ancestors.
 * Runtime representations do not recover interfaces, generics, parameter names or dependency equivalence.
 */
export const DESIGN_PARAMETER_TYPES_METADATA = new ValueMetadataDefinition<readonly IRuntimeType[]>(
  "design:paramtypes",
);
