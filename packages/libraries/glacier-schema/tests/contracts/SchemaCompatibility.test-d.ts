import { Schema } from "../../index.js";
import type { IJsonSchemaCompatibilityOptions } from "../../index.js";

/** Required service construction is not invoked by metadata-only inspection. */
class Dto {
  public constructor(public readonly service: string) {}
}
const options: IJsonSchemaCompatibilityOptions = {
  direction: "output",
  wire: "json",
  coerce: false,
};
Schema.assertJsonSchemaCompatibility(Dto, options);
// @ts-expect-error compatibility has no result/document value
const document: object = Schema.assertJsonSchemaCompatibility(Dto, options);
// @ts-expect-error instances are not schema class references
Schema.assertJsonSchemaCompatibility(new Dto("service"), options);
// @ts-expect-error wire is bounded
Schema.assertJsonSchemaCompatibility(Dto, { direction: "input", wire: "binary", coerce: false });
// @ts-expect-error direction is bounded
Schema.assertJsonSchemaCompatibility(Dto, { direction: "both", wire: "json", coerce: false });
// @ts-expect-error coercion choice is explicit
Schema.assertJsonSchemaCompatibility(Dto, { direction: "input", wire: "json" });
// @ts-expect-error options are readonly
options.wire = "text";
void document;
