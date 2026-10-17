import {
  DESIGN_PARAMETER_TYPES_METADATA,
  MetadataDiscovery,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("before-registration");

/** Emits real compiler metadata before registration, while retaining a manual annotation. */
@LABEL.decorator("manual")
class UnregisteredConsumer {
  public constructor(public readonly label: string) {}
}

/** Observes the same original declaration before and after registration without replaying emission. */
export class UnregisteredCompilerFixture {
  /** Reads only public metadata and discovery operations. */
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
