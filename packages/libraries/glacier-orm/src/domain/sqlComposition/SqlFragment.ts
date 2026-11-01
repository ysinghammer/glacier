/** A PostgreSQL statement and its positional parameter values. */
export interface ICompiledSql {
  /** SQL text containing PostgreSQL positional placeholders. */
  readonly text: string;

  /** Caller-owned parameter array in placeholder order; values retain their original identities. */
  readonly values: unknown[];
}

/** Marks one value as a parameter even when it is itself a SQL fragment. */
class SqlBoundParameter {
  /** Caller-owned value to bind without treating it as SQL structure. */
  public readonly value: unknown;

  /**
   * Retains a value for later parameter binding without cloning it.
   * @param value Caller-owned value to bind.
   */
  public constructor(value: unknown) {
    this.value = value;
    Object.freeze(this);
  }
}

/** An immutable SQL template that composes nested fragments and binds all other values. */
export class SqlFragment {
  /** Copied literal template segments, including the final segment. */
  private readonly strings: readonly string[];

  /** Copied interpolation slots; referenced parameter values are not cloned or frozen. */
  private readonly interpolations: readonly unknown[];

  /**
   * Constructs a fragment from literal SQL segments and interpolation slots.
   * Treat literal segments as trusted SQL; use interpolations for untrusted values.
   * @param strings - Trusted SQL segments; there must be exactly one more segment than slots.
   * @param interpolations - Nested fragments or parameter values in template order.
   * @throws {RangeError} If the number of segments does not match the interpolation count.
   */
  public constructor(strings: readonly string[], interpolations: readonly unknown[]) {
    if (strings.length !== interpolations.length + 1) {
      throw new RangeError("SQL templates must have one more segment than interpolations");
    }

    this.strings = Object.freeze([...strings]);
    this.interpolations = Object.freeze([...interpolations]);
    Object.freeze(this);
  }

  /**
   * Creates a fragment binding one value even when that value is a SQL fragment.
   * @param value Caller-owned value to bind without interpolation or cloning.
   * @returns Immutable fragment containing exactly one positional parameter.
   */
  public static parameter(value: unknown): SqlFragment {
    return new SqlFragment(["", ""], [new SqlBoundParameter(value)]);
  }

  /**
   * Compiles the complete fragment tree with fresh, consecutively numbered parameters.
   * @returns A new statement and mutable values array; parameter objects retain their identities.
   */
  public compile(): ICompiledSql {
    const values: unknown[] = [];
    const text = this.appendTo(values);
    return { text, values };
  }

  /**
   * Appends this fragment's parameters to the shared compilation accumulator.
   * @param values - Mutable accumulator shared by nested fragments in traversal order.
   * @returns SQL text numbered according to the accumulator's resulting positions.
   */
  private appendTo(values: unknown[]): string {
    let text = "";
    for (const [index, segment] of this.strings.entries()) {
      text += segment;
      if (index < this.interpolations.length) {
        text += this.compileInterpolation(this.interpolations[index], values);
      }
    }
    return text;
  }

  /**
   * Compiles a nested fragment or appends one parameter to the accumulator.
   * @param interpolation - Fragment or ordinary value occupying one template slot.
   * @param values - Mutable accumulator shared by nested fragments.
   * @returns Nested SQL text or the placeholder for the appended value.
   */
  private compileInterpolation(interpolation: unknown, values: unknown[]): string {
    if (interpolation instanceof SqlBoundParameter) {
      values.push(interpolation.value);
      return `$${values.length}`;
    }
    if (interpolation instanceof SqlFragment) {
      return interpolation.appendTo(values);
    }
    values.push(interpolation);
    return `$${values.length}`;
  }
}
