import { ListMetadataDefinition } from "@glacier/reflection";
import type { IFieldDefinition } from "../schema/IFieldDefinition.js";

/**
 * Class-level list of declared fields in declaration order, accumulated ancestor-first. A subclass that
 * redeclares a name appears after its ancestor's entry, which it overrides when the schema is compiled.
 */
export const FIELDS_METADATA = new ListMetadataDefinition<IFieldDefinition>(
  "glacier-schema:fields",
);
