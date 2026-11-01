import { ListMetadataDefinition } from "@glacier/reflection";
import type { IFieldDeclaration } from "../schema/types/IFieldDeclaration.js";

/**
 * Reflection key for each class's own field declarations, stored in declaration order for schema merging.
 */
export const FIELDS_METADATA = new ListMetadataDefinition<IFieldDeclaration>(
  "glacier-schema:fields",
);
