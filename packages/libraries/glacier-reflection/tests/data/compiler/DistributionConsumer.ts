import "@glacier/reflection/register";
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("independent");

/** Genuine compiler-emitted consumer; explicit registration executes before declarations. */
@LABEL.decorator("consumer")
export class DistributionConsumer {
  /**
   * Mutable decorated instance field used to verify emitted property metadata.
   * @default "Ada"
   */
  @LABEL.decorator("field")
  public name: string = "Ada";

  /**
   * Creates a consumer with one emitted constructor parameter.
   * @param count Numeric value retained for constructor metadata observation.
   */
  public constructor(
    /** Readonly count retained for emitted constructor metadata. */
    public readonly count: number,
  ) {}

  /**
   * Produces a labeled value while carrying emitted parameter and return metadata.
   * @param input Flag appended to the instance name.
   * @returns The instance name and flag joined by a colon.
   */
  @LABEL.decorator("method")
  public describe(input: boolean): string {
    return `${this.name}:${input}`;
  }

  /**
   * Exposes compiler metadata observations through public package-root operations.
   * @returns Custom, property, constructor, parameter, and return metadata reads.
   */
  public static observations(): unknown {
    return {
      custom: LABEL.read(new DistributionConsumer(1)),
      property: DESIGN_TYPE_METADATA.read(this, { kind: "member", member: "name" }),
      constructor: DESIGN_PARAMETER_TYPES_METADATA.read(this),
      parameters: DESIGN_PARAMETER_TYPES_METADATA.read(this, {
        kind: "member",
        member: "describe",
      }),
      returns: DESIGN_RETURN_TYPE_METADATA.read(this, { kind: "member", member: "describe" }),
    };
  }
}
