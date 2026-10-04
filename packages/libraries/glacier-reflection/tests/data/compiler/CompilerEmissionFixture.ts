import "@glacier/reflection";
import { CompilerFixtureDecoration } from "./CompilerFixtureDecoration.js";

/** Provides genuine legacy-emission input; it makes no metadata-library behavior assertion. */
@CompilerFixtureDecoration.annotate
export class CompilerEmissionFixture {
  /** Retains a scalar constructor argument so the compiler emits a parameter representation. */
  public constructor(public readonly label: string) {}

  /** Returns the supplied scalar unchanged, providing method parameter and return emission. */
  @CompilerFixtureDecoration.annotate
  public describe(input: string): string {
    return input;
  }
}
