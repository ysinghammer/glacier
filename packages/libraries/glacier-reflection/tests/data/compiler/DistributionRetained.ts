import "@glacier/reflection";

/** A local compiler-required callback retains no runtime export from the package. */
const DECORATE = (target: object): void => {
  void target;
};

/** Real decorated declaration after a deliberately side-effect-only package import. */
@DECORATE
export class DistributionRetained {
  public static readonly hasCompilerHandler = typeof Reflect.metadata === "function";

  public constructor(public readonly count: number) {}
}
