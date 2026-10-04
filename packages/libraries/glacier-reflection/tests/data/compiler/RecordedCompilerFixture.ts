import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
} from "@glacier/reflection";
import { CompilerFixtureDecoration } from "./CompilerFixtureDecoration.js";

/** Genuine TypeScript emission, with runtime root import preceding declaration execution. */
@CompilerFixtureDecoration.annotate
class RecordedConsumer {
  /** Emits constructor parameter representations without constructing a consumer. */
  public constructor(public readonly label: string) {}

  @CompilerFixtureDecoration.annotate
  public field!: number;

  /** Emits all three member metadata keys. */
  @CompilerFixtureDecoration.annotate
  public describe(input: boolean): string {
    return String(input);
  }
}

/** Reports only public reads of genuine emitted declarations. */
export class RecordedCompilerFixture {
  /** Keeps runtime representations observable without serializing function identities. */
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
