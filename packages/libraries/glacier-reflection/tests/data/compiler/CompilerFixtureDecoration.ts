/** Supplies a test-owned legacy decorator without recording metadata or replacing declarations. */
export class CompilerFixtureDecoration {
  /**
   * Accepts a class or member decorator invocation without changing its target.
   * @param target Decorated class or member owner.
   * @param member Optional member key; omitted for class decoration.
   * @returns No value and no replacement declaration.
   */
  public static annotate(target: object, member?: string | symbol): void {
    void target;
    void member;
  }
}
