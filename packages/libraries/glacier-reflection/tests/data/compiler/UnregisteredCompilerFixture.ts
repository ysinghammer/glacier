import {
  DESIGN_PARAMETER_TYPES_METADATA,
  MetadataDiscovery,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("before-registration");

/** Emits real compiler metadata before registration, while retaining a manual annotation. */
@LABEL.decorator("manual")
class UnregisteredConsumer {
  /**
   * Retains one argument whose metadata is emitted before registration.
   * @param label Text value represented in compiler metadata.
   */
  public constructor(
    /** Readonly label retained for compiler emission before registration. */
    public readonly label: string,
  ) {}
}

/** Observes the same original declaration before and after registration without replaying emission. */
export class UnregisteredCompilerFixture {
  /**
   * Reads compiler and manual metadata through public operations.
   * @returns Compiler, manual, and discovery observations.
   */
  public static read(): unknown {
    const definitions = MetadataDiscovery.definitions(UnregisteredConsumer);
    return {
      compiler: DESIGN_PARAMETER_TYPES_METADATA.read(UnregisteredConsumer),
      manual: LABEL.read(UnregisteredConsumer),
      manualDiscovered:
        definitions.isValid &&
        definitions.definitions.length === 1 &&
        definitions.definitions[0] === LABEL,
    };
  }
}
