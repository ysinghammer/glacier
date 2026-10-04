/** Supplies a test-owned legacy decorator without recording metadata or replacing declarations. */
export class CompilerFixtureDecoration {
  /** Accepts class/member compiler callbacks without mutating their targets. */
  public static annotate(target: object, member?: string | symbol): void {
    void target;
    void member;
  }
}
