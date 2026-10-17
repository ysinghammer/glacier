import { ListMetadataDefinition } from "@glacier/reflection";
import type { IFieldDeclaration } from "../schema/IFieldDeclaration.js";

/**
 * Class-level list of declared fields in declaration order, accumulated ancestor-first. A subclass entry
 * with a type replaces its ancestor's entry of the same name; one with only modifiers adds to it when the
 * schema is compiled.
 */
export const FIELDS_METADATA = new ListMetadataDefinition<IFieldDeclaration>(
  "glacier-schema:fields",
);
