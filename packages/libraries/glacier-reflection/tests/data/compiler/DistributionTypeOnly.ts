import type { ValueMetadataDefinition } from "@glacier/reflection";

/** Erased public-root type use must not evaluate the runtime package. */
export class DistributionTypeOnly {
  /**
   * Reads the name from a type-only supplied definition without creating it.
   * @param definition Public definition value supplied by the caller.
   * @returns The definition's declared name.
   */
  public static name(definition: ValueMetadataDefinition<string>): string {
    return definition.name;
  }
}
