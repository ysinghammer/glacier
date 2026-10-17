import {
  DESIGN_PARAMETER_TYPES_METADATA,
  MetadataDiscovery,
  ValueMetadataDefinition,
} from "@glacier/reflection";
import type { IClass } from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("ordinary-bundle");

/** Exercises a used root API without opting into compiler registration. */
@LABEL.decorator("manual")
class OrdinaryConsumer {}

/** Exposes test-owned observations from an independently bundled ordinary root graph. */
export class DistributionOrdinaryMetadata {
  /** Observes the retention entry's genuine records when built as a separate entry in that same graph. */
  public static compilerRecord(target: IClass): unknown {
    const parameters = DESIGN_PARAMETER_TYPES_METADATA.read(target);
    const definitions = MetadataDiscovery.definitions(target);
    return {
      parameters,
      frozen: parameters.isValid && parameters.isPresent && Object.isFrozen(parameters.value),
      identity:
        definitions.isValid &&
        definitions.definitions.length === 1 &&
        definitions.definitions[0] === DESIGN_PARAMETER_TYPES_METADATA,
    };
  }

  /** Verifies manual reads and exact discovery identity without touching a foreign accessor. */
  public static observations(): unknown {
    const definitions = MetadataDiscovery.definitions(OrdinaryConsumer);
    return {
      inactive: Object.getOwnPropertyDescriptor(Reflect, "metadata") === undefined,
      manual: LABEL.read(OrdinaryConsumer),
      identity:
        definitions.isValid &&
        definitions.definitions.length === 1 &&
        definitions.definitions[0] === LABEL,
    };
  }
}
