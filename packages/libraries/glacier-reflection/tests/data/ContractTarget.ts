/** Base fixture contributes an inherited instance property to address-contract checks. */
class ContractBase {
  /**
   * Mutable inherited value used to verify prototype-chain addressing.
   * @default "base"
   */
  public inherited = "base";
}
/** Supplies representative instance, static, numeric, symbol, and parameter addresses. */
export class ContractTarget extends ContractBase {
  /**
   * Mutable instance data used to verify string member addresses.
   * @default "instance"
   */
  public field = "instance";
  /**
   * Mutable instance data used to verify numeric property-key normalization.
   * @default "numeric"
   */
  public 7 = "numeric";
  /**
   * Mutable static data used to verify static-side addressing.
   * @default "static"
   */
  public static field = "static";

  /**
   * Supplies fixed constructor parameters without requiring an instance during lookup.
   * @param first First constructor parameter value; defaults to `"first"`.
   * @param second Second constructor parameter value; defaults to `"second"`.
   */
  constructor(
    /**
     * Readonly first constructor value used by metadata position checks.
     * @default "first"
     */
    public readonly first = "first",
    /**
     * Readonly optional second constructor value used by position checks.
     * @default "second"
     */
    public readonly second = "second",
  ) {
    super();
  }
  /**
   * Distinguishes method parameter positions for instance-member checks.
   * @param first Required first parameter value.
   * @param second Optional second parameter value.
   * @returns No value; consumes the supplied parameters only.
   */
  public method(first: string, second?: number): void {
    void [first, second];
  }
  /**
   * Supplies a symbol-keyed method address distinct from string keys.
   * @returns An empty string iterator.
   */
  public [Symbol.iterator](): Iterator<string> {
    return [][Symbol.iterator]();
  }
  /**
   * Distinguishes static method parameters from instance method parameters.
   * @param first Required first parameter value.
   * @param second Optional second parameter value.
   * @returns No value; consumes the supplied parameters only.
   */
  public static method(first: string, second?: number): void {
    void [first, second];
  }
}
