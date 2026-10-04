import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const LABEL = new ValueMetadataDefinition<string>("independent");

/** Genuine compiler-emitted consumer; its root runtime import must execute first. */
@LABEL.decorator("consumer")
export class DistributionConsumer {
  @LABEL.decorator("field")
  public name: string = "Ada";

  public constructor(public readonly count: number) {}

  /** Records the actual emitted parameter and return representations. */
  @LABEL.decorator("method")
  public describe(input: boolean): string {
    return `${this.name}:${input}`;
  }

  /** Exposes only observations made through public package-root operations. */
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
