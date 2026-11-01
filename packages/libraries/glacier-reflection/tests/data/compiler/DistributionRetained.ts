import "@glacier/reflection/register";

/** A local compiler-required callback retains no runtime export from the package. */
const DECORATE = (target: object): void => {
  void target;
};

/** Real decorated declaration after a deliberately side-effect-only package import. */
@DECORATE
export class DistributionRetained {
  /** Readonly computed flag reporting whether registration is active at module evaluation. */
  public static readonly hasCompilerHandler = typeof Reflect.metadata === "function";

  /**
   * Retains a constructor parameter so the compiler emits its runtime representation.
   * @param count Numeric constructor input retained for compiler-emission checks.
   */
  public constructor(
    /** Readonly count retained for emitted constructor metadata. */
    public readonly count: number,
  ) {}
}
