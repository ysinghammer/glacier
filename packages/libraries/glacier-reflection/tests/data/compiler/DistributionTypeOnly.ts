import type { ValueMetadataDefinition } from "@glacier/reflection";

/** Erased public-root type use must not evaluate the runtime package. */
export class DistributionTypeOnly {
  /** Checks a definition shape without creating or importing one at runtime. */
  public static name(definition: ValueMetadataDefinition<string>): string {
    return definition.name;
  }
}
