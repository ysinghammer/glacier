/** Inherited declarations are addressed without inspecting instance values. */
class ContractBase {
  public inherited = "base";
}
/** Supplies every direct address category without constructing during lookup. */
export class ContractTarget extends ContractBase {
  public field = "instance";
  public 7 = "numeric";
  public static field = "static";
  constructor(
    public readonly first = "first",
    public readonly second = "second",
  ) {
    super();
  }
  /** Fixed parameters distinguish individual metadata positions. */
  public method(first: string, second?: number): void {
    void [first, second];
  }
  /** Symbol addressing must not collide with string addressing. */
  public [Symbol.iterator](): Iterator<string> {
    return [][Symbol.iterator]();
  }
  /** Static parameters remain separate from instance parameters. */
  public static method(first: string, second?: number): void {
    void [first, second];
  }
}
