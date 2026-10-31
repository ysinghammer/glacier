import "@glacier/reflection/register";
import { CompilerFixtureDecoration } from "./CompilerFixtureDecoration.js";

/** Provides genuine legacy-emission input; it makes no metadata-library behavior assertion. */
@CompilerFixtureDecoration.annotate
export class CompilerEmissionFixture {
  /**
   * Retains a scalar constructor argument for compiler parameter emission.
   * @param label Text value represented in emitted constructor metadata.
   */
  public constructor(
    /** Readonly label retained for emitted constructor metadata. */
    public readonly label: string,
  ) {}

  /**
   * Returns the input unchanged to provide method parameter and return emission.
   * @param input Text value represented in emitted method metadata.
   * @returns The same text value.
   */
  @CompilerFixtureDecoration.annotate
  public describe(input: string): string {
    return input;
  }
}
