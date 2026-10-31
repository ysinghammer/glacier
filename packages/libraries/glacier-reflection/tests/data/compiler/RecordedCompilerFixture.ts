import "@glacier/reflection/register";
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
} from "@glacier/reflection";
import { CompilerFixtureDecoration } from "./CompilerFixtureDecoration.js";

/** Genuine TypeScript emission, with explicit registration preceding declaration execution. */
@CompilerFixtureDecoration.annotate
class RecordedConsumer {
  /**
   * Emits constructor parameter representations without constructing a consumer.
   * @param label Text value represented by emitted constructor metadata.
   */
  public constructor(
    /** Readonly label retained for emitted constructor metadata. */
    public readonly label: string,
  ) {}

  /** Mutable declared field provides an emitted design:type representation. */
  @CompilerFixtureDecoration.annotate
  public field!: number;

  /**
   * Emits method type, parameter, and return metadata keys.
   * @param input Boolean value represented by emitted parameter metadata.
   * @returns The input converted to text.
   */
  @CompilerFixtureDecoration.annotate
  public describe(input: boolean): string {
    return String(input);
  }
}

/** Reports only public reads of genuine emitted declarations. */
export class RecordedCompilerFixture {
  /**
   * Reads emitted constructor and member representations through public metadata operations.
   * @returns Ordered metadata read outcomes for the fixture declarations.
   */
  public static read(): readonly unknown[] {
    return [
      DESIGN_PARAMETER_TYPES_METADATA.read(RecordedConsumer),
      DESIGN_TYPE_METADATA.read(RecordedConsumer, { kind: "member", member: "field" }),
      DESIGN_TYPE_METADATA.read(RecordedConsumer, { kind: "member", member: "describe" }),
      DESIGN_PARAMETER_TYPES_METADATA.read(RecordedConsumer, {
        kind: "member",
        member: "describe",
      }),
      DESIGN_RETURN_TYPE_METADATA.read(RecordedConsumer, { kind: "member", member: "describe" }),
    ];
  }
}
