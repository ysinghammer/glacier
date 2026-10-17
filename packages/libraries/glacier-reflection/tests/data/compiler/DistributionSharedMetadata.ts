import "@glacier/reflection/register";
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
  MetadataDiscovery,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("shared-bundle");
let constructions = 0;

/** Genuine emitted declarations share the registration entry's canonical storage graph. */
@LABEL.decorator("consumer")
class SharedConsumer {
  public constructor(public readonly count: number) {
    constructions++;
  }

  /** Emits the method type, parameter and return metadata without executing the method. */
  @LABEL.decorator("method")
  public describe(input: boolean): string {
    return String(input);
  }
}

/** Reports exact public definition/storage identities inside one actual bundle graph. */
export class DistributionSharedMetadata {
  /** Checks recording, frozen whole-value identity, discovery and absence of consumer construction. */
  public static observations(): unknown {
    const parameters = DESIGN_PARAMETER_TYPES_METADATA.read(SharedConsumer);
    const repeated = DESIGN_PARAMETER_TYPES_METADATA.read(SharedConsumer);
    const definitions = MetadataDiscovery.definitions(SharedConsumer);
    const methodDefinitions = MetadataDiscovery.definitions(SharedConsumer, {
      kind: "member",
      member: "describe",
    });
    return {
      manual: LABEL.read(SharedConsumer),
      parameters,
      frozen: parameters.isValid && parameters.isPresent && Object.isFrozen(parameters.value),
      sameSnapshot:
        parameters.isValid &&
        parameters.isPresent &&
        repeated.isValid &&
        repeated.isPresent &&
        parameters.value === repeated.value,
      classIdentity:
        definitions.isValid &&
        definitions.definitions.length === 2 &&
        definitions.definitions.includes(LABEL) &&
        definitions.definitions.includes(DESIGN_PARAMETER_TYPES_METADATA),
      methodIdentity:
        methodDefinitions.isValid &&
        methodDefinitions.definitions.length === 4 &&
        methodDefinitions.definitions.includes(LABEL) &&
        methodDefinitions.definitions.includes(DESIGN_TYPE_METADATA) &&
        methodDefinitions.definitions.includes(DESIGN_PARAMETER_TYPES_METADATA) &&
        methodDefinitions.definitions.includes(DESIGN_RETURN_TYPE_METADATA),
      returns: DESIGN_RETURN_TYPE_METADATA.read(SharedConsumer, {
        kind: "member",
        member: "describe",
      }),
      constructions,
    };
  }
}
